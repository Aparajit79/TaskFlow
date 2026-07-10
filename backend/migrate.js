const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'task_matrix',
  password: process.env.DB_PASSWORD || '123',
  port: process.env.DB_PORT || 5432,
  options: '-c search_path=task_matrix'
});

async function run() {
  console.log('Starting TaskFlow Database Authentication Migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Users Table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Alter Members Table to reference user_id
    console.log('Altering members table to add user_id...');
    await client.query(`
      ALTER TABLE members 
      ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE
    `);

    // Remove unique constraint on name if it exists, and make it unique per user_id
    // First find existing constraint names to drop them
    const constraintsRes = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'unique_project_user' 
         OR conname = 'unique_project_member'
    `);
    
    for (const row of constraintsRes.rows) {
      console.log(`Dropping legacy constraint: ${row.conname}`);
      await client.query(`ALTER TABLE members DROP CONSTRAINT IF EXISTS ${row.conname}`);
    }

    // Add unique_project_user constraint
    console.log('Adding unique_project_user constraint to members table...');
    await client.query(`
      ALTER TABLE members 
      ADD CONSTRAINT unique_project_user UNIQUE (project_id, user_id)
    `);

    // 3. Hash Passwords and Seed Users
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const memberPasswordHash = await bcrypt.hash('member123', 10);

    console.log('Inserting seed users...');
    
    // Seed Admin
    const adminUser = await client.query(`
      INSERT INTO users (name, email, username, password_hash, role)
      VALUES ('Admin Manager', 'admin@taskflow.com', 'admin', $1, 'admin')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `, [adminPasswordHash]);

    // Seed John Doe (Member)
    const johnUser = await client.query(`
      INSERT INTO users (name, email, username, password_hash, role)
      VALUES ('John Doe', 'john@taskflow.com', 'john_doe', $1, 'member')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `, [memberPasswordHash]);

    // Seed Jane Smith (Member)
    const janeUser = await client.query(`
      INSERT INTO users (name, email, username, password_hash, role)
      VALUES ('Jane Smith', 'jane@taskflow.com', 'jane_smith', $1, 'member')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `, [memberPasswordHash]);

    const johnId = johnUser.rows[0].id;
    const janeId = janeUser.rows[0].id;

    // 4. Update existing members in the system to link them to their respective user IDs
    console.log('Linking existing members by name matches...');
    await client.query(`
      UPDATE members SET user_id = $1 WHERE name ILIKE '%john%' AND user_id IS NULL
    `, [johnId]);

    await client.query(`
      UPDATE members SET user_id = $1 WHERE name ILIKE '%jane%' AND user_id IS NULL
    `, [janeId]);

    // For any other members that aren't John or Jane, create a user account for them
    const unlinkedMembers = await client.query('SELECT DISTINCT name FROM members WHERE user_id IS NULL');
    for (const member of unlinkedMembers.rows) {
      const username = member.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      console.log(`Creating user login for legacy member: ${member.name} (${username})`);
      const userInsert = await client.query(`
        INSERT INTO users (name, email, username, password_hash, role)
        VALUES ($1, $2, $3, $4, 'member')
        ON CONFLICT (username) DO NOTHING
        RETURNING id
      `, [member.name, `${username}@taskflow.com`, username, memberPasswordHash]);

      if (userInsert.rows.length > 0) {
        await client.query('UPDATE members SET user_id = $1 WHERE name = $2', [userInsert.rows[0].id, member.name]);
      }
    }

    const projectsRes = await client.query('SELECT id FROM projects');
    for (const project of projectsRes.rows) {
      // Ensure John is in each project as a default member so John has workspaces to view
      await client.query(`
        INSERT INTO members (project_id, user_id, name, role, avatar)
        VALUES ($1, $2, 'John Doe', 'Senior Developer', 'J')
        ON CONFLICT (project_id, user_id) DO NOTHING
      `, [project.id, johnId]);

      // Ensure Jane is in each project too
      await client.query(`
        INSERT INTO members (project_id, user_id, name, role, avatar)
        VALUES ($1, $2, 'Jane Smith', 'UI/UX Designer', 'J')
        ON CONFLICT (project_id, user_id) DO NOTHING
      `, [project.id, janeId]);
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
