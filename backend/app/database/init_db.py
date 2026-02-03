# app/database/init_db.py
from app.database.base import Base
from app.database.session import engine  # your SQLAlchemy engine
from app.models import user  # import all models so Base knows about them
from app.models import incident
from app.models import task
from app.models import guideline
from app.models import prediction
from app.models import incident_prediction
from app.models import prediction

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    init_db()
