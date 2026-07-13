const { Pool } = require('pg');
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
  console.log('Starting TaskFlow Scrum Module Migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Sprints Table
    console.log('Creating sprints table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sprints (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        sprint_number INT NOT NULL,
        goal TEXT,
        duration_weeks INT NOT NULL DEFAULT 2,
        status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed'
        start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Add sprint_id to tasks table
    console.log('Adding sprint_id to tasks table...');
    await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS sprint_id INT REFERENCES sprints(id) ON DELETE SET NULL
    `);

    // 3. Create Scrum Meetings Table (Daily Standups)
    console.log('Creating scrum_meetings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS scrum_meetings (
        id SERIAL PRIMARY KEY,
        sprint_id INT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        yesterday_done TEXT NOT NULL,
        today_plan TEXT NOT NULL,
        blockers TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create Retro Items Table (Sprint Retrospectives)
    console.log('Creating retro_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS retro_items (
        id SERIAL PRIMARY KEY,
        sprint_id INT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL, -- 'well', 'improve', 'action'
        content TEXT NOT NULL,
        votes INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Scrum Module Migration Completed Successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back changes:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
