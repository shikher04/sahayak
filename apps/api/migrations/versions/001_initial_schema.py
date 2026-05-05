"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.execute("""
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            uid_token VARCHAR(64) UNIQUE NOT NULL,
            name VARCHAR(100),
            email VARCHAR(100),
            provider VARCHAR(20) NOT NULL DEFAULT 'guest',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_users_uid_token ON users (uid_token)")
    op.execute("CREATE INDEX ix_users_email ON users (email)")

    op.execute("""
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            state VARCHAR(50),
            age INTEGER,
            gender VARCHAR(10),
            annual_income VARCHAR(20),
            caste_category VARCHAR(10),
            occupation VARCHAR(50),
            has_land BOOLEAN,
            land_area_hectares NUMERIC(10,2),
            updated_at TIMESTAMPTZ DEFAULT now()
        )
    """)

    op.execute("""
        CREATE TABLE schemes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(200) NOT NULL,
            ministry VARCHAR(150) NOT NULL,
            category VARCHAR(50) NOT NULL,
            level VARCHAR(10) NOT NULL DEFAULT 'central',
            state_code VARCHAR(5),
            description TEXT NOT NULL,
            benefit_amount VARCHAR(100),
            eligibility_criteria JSONB DEFAULT '{}',
            required_documents JSONB DEFAULT '[]',
            application_url VARCHAR(300),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_schemes_category ON schemes (category)")
    op.execute("CREATE INDEX ix_schemes_state_code ON schemes (state_code)")
    op.execute("CREATE INDEX ix_schemes_is_active ON schemes (is_active)")

    op.execute("""
        CREATE TABLE rights (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(200) NOT NULL,
            category VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            articles JSONB DEFAULT '[]',
            action_steps JSONB DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_rights_category ON rights (category)")

    op.execute("""
        CREATE TABLE chat_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            language VARCHAR(10) DEFAULT 'en',
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """)

    op.execute("""
        CREATE TABLE chat_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
            role VARCHAR(10) NOT NULL,
            content TEXT NOT NULL,
            sources JSONB DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_chat_messages_session_id ON chat_messages (session_id)")

    op.execute("""
        CREATE TABLE saved_schemes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            scheme_id UUID REFERENCES schemes(id) ON DELETE CASCADE,
            saved_at TIMESTAMPTZ DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_saved_schemes_user_id ON saved_schemes (user_id)")
    op.execute("CREATE INDEX ix_saved_schemes_scheme_id ON saved_schemes (scheme_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS saved_schemes")
    op.execute("DROP TABLE IF EXISTS chat_messages")
    op.execute("DROP TABLE IF EXISTS chat_sessions")
    op.execute("DROP TABLE IF EXISTS rights")
    op.execute("DROP TABLE IF EXISTS schemes")
    op.execute("DROP TABLE IF EXISTS profiles")
    op.execute("DROP TABLE IF EXISTS users")
