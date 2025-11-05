-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members with roles
CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('admin', 'member')) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Robots table
CREATE TABLE robots (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    owner_type VARCHAR(10) CHECK (owner_type IN ('user', 'group')) NOT NULL,
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    owner_group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (owner_type = 'user' AND owner_user_id IS NOT NULL AND owner_group_id IS NULL) OR
        (owner_type = 'group' AND owner_group_id IS NOT NULL AND owner_user_id IS NULL)
    )
);

-- Robot permissions
CREATE TABLE robot_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    robot_id INTEGER REFERENCES robots(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) CHECK (permission_type IN ('usage', 'admin')) NOT NULL,
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, robot_id)
);

-- Robot settings
CREATE TABLE robot_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    robot_id INTEGER REFERENCES robots(id) ON DELETE CASCADE,
    settings JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, robot_id)
);

-- Indexes for performance
CREATE INDEX idx_robots_serial_number ON robots(serial_number);
CREATE INDEX idx_robots_owner_user ON robots(owner_user_id);
CREATE INDEX idx_robots_owner_group ON robots(owner_group_id);
CREATE INDEX idx_robot_permissions_user ON robot_permissions(user_id);
CREATE INDEX idx_robot_permissions_robot ON robot_permissions(robot_id);
CREATE INDEX idx_robot_settings_user_robot ON robot_settings(user_id, robot_id);
