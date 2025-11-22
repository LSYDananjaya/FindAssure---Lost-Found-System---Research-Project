-- AI-Driven Lost & Found Verification System
-- Database Schema for ai-question-service

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS item_questions CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- Create items table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    founder_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create item_questions table
CREATE TABLE item_questions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    founder_answer TEXT NOT NULL,
    owner_answer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create verification_attempts table
CREATE TABLE verification_attempts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    claimer_id VARCHAR(255) NOT NULL,
    match_score DECIMAL(5,2),
    match_result TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_items_founder_id ON items(founder_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_item_questions_item_id ON item_questions(item_id);
CREATE INDEX idx_verification_attempts_item_id ON verification_attempts(item_id);
CREATE INDEX idx_verification_attempts_claimer_id ON verification_attempts(claimer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO items (category, description, founder_id) 
-- VALUES ('Electronics', 'Black iPhone 13 Pro with blue case', 'founder_123');

-- INSERT INTO item_questions (item_id, question, founder_answer) 
-- VALUES 
--     (1, 'What is the screen size of the phone?', '6.1 inches'),
--     (1, 'What color is the phone case?', 'Blue'),
--     (1, 'Is there any damage to the screen?', 'Small scratch on bottom left');

COMMENT ON TABLE items IS 'Stores lost/found items with basic details';
COMMENT ON TABLE item_questions IS 'Stores verification questions with both founder and owner answers';
COMMENT ON TABLE verification_attempts IS 'Stores verification attempts by potential owners with semantic matching results';
COMMENT ON COLUMN items.founder_id IS 'ID of the person who found the item';
COMMENT ON COLUMN item_questions.founder_answer IS 'Answer provided by the founder for verification';
COMMENT ON COLUMN item_questions.owner_answer IS 'Answer provided by the claimer/owner for verification';
COMMENT ON COLUMN verification_attempts.match_score IS 'Overall semantic similarity score (0-100)';
COMMENT ON COLUMN verification_attempts.match_result IS 'Detailed matching analysis from Gemini API';
