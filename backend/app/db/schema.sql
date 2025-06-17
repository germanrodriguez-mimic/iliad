CREATE SCHEMA IF NOT EXISTS preproduction;
SET search_path TO preproduction;

---
--- Table Definitions
---

-- Embodiments Table
CREATE TABLE embodiments (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE,
    description TEXT
);

-- Teleop Modes Table
CREATE TABLE teleop_modes (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE,
    description TEXT
);

-- Tasks Table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    name TEXT,
    description TEXT,
    status TEXT CHECK (status IN ('created', 'collecting data', 'ready for training', 'training', 'evaluating', 'done', 'discarded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_external BOOLEAN
);

-- Task Variant Table
CREATE TABLE task_variants (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name TEXT,
    description TEXT,
    items TEXT,
    embodiment_id INT REFERENCES embodiments(id),
    teleop_mode_id INT REFERENCES teleop_modes(id),
    notes TEXT,
    media TEXT[]
);

-- Subdatasets Table
CREATE TABLE subdatasets (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE,
    description TEXT,
    notes TEXT,
    embodiment_id INT REFERENCES embodiments(id) ON DELETE SET NULL,
    teleop_mode_id INT REFERENCES teleop_modes(id) ON DELETE SET NULL
);

-- Tasks-to-Subdatasets Junction Table
CREATE TABLE tasks_to_subdatasets (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    subdataset_id INT NOT NULL REFERENCES subdatasets(id) ON DELETE CASCADE,
    UNIQUE (task_id, subdataset_id)
);

-- Raw Episodes Table
CREATE TABLE raw_episodes (
    id SERIAL PRIMARY KEY,
    subdataset_id INT REFERENCES subdatasets(id),
    operator TEXT,
    url TEXT,
    label TEXT CHECK (label IN ('good', 'bad', 'contains correction', 'corrupted')),
    repository TEXT,
    git_commit TEXT,
    recorded_at TIMESTAMPTZ,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Episode Conversion Versions Table
CREATE TABLE episode_conversion_versions (
    id SERIAL PRIMARY KEY,
    version TEXT,
    repository TEXT,
    git_commit TEXT,
    is_active BOOLEAN,
    is_main BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Episodes Table
CREATE TABLE episodes (
    id SERIAL PRIMARY KEY,
    subdataset_id INT REFERENCES subdatasets(id),
    raw_episode_id INT REFERENCES raw_episodes(id),
    conversion_version_id INT REFERENCES episode_conversion_versions(id),
    url TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datasets Table
CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subdatasets-to-Datasets Junction Table
CREATE TABLE subdatasets_to_datasets (
    id SERIAL PRIMARY KEY,
    dataset_id INT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    subdataset_id INT NOT NULL REFERENCES subdatasets(id) ON DELETE CASCADE,
    UNIQUE (dataset_id, subdataset_id)
);

-- Training Runs Table
CREATE TABLE training_runs (
    id SERIAL PRIMARY KEY,
    dataset_id INT REFERENCES datasets(id),
    url TEXT
);

-- Training-Runs-to-Tasks Junction Table
CREATE TABLE training_runs_to_tasks (
    id SERIAL PRIMARY KEY,
    training_run_id INT NOT NULL REFERENCES training_runs(id) ON DELETE CASCADE,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE (training_run_id, task_id)
);

-- Checkpoints Table
CREATE TABLE checkpoints (
    id SERIAL PRIMARY KEY,
    training_run_id INT REFERENCES training_runs(id),
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations Table
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id),
    name TEXT,
    description TEXT,
    media TEXT,
    items TEXT,
    embodiment_id INT REFERENCES embodiments(id),
    notes TEXT
);

-- Evaluation Runs Table
CREATE TABLE evaluation_runs (
    id SERIAL PRIMARY KEY,
    evaluation_id INT REFERENCES evaluations(id),
    checkpoint_id INT REFERENCES checkpoints(id),
    is_success BOOLEAN,
    duration_ms INT,
    media TEXT,
    notes TEXT
);

---
--- Triggers and Functions
---

-- Function to automatically insert a 'default' task variant for a new task
CREATE OR REPLACE FUNCTION create_default_task_variant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO preproduction.task_variants (task_id, name, description)
    VALUES (NEW.id, 'default', 'Default variant for this task.');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function after a new row is inserted into the tasks table
CREATE TRIGGER on_new_task_insert
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION create_default_task_variant(); 