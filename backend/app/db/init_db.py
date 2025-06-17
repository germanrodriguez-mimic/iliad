import sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from app.db.session import engine

def init_db():
    try:
        # Read the schema SQL file
        schema_path = Path(__file__).parent / "schema.sql"
        with open(schema_path, "r") as f:
            schema_sql = f.read()

        # Execute the schema SQL
        with engine.connect() as connection:
            connection.execute(text(schema_sql))
            connection.commit()
            print("✅ Database schema initialized successfully!")
            return True
    except Exception as e:
        print(f"❌ Database schema initialization failed: {str(e)}")
        return False

if __name__ == "__main__":
    init_db() 