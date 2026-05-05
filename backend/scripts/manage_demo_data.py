import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import text

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from auth import get_password_hash
from database import Base, SessionLocal, engine
from models import Driver, DriverApplication, User
from routes.drivers import ALLOWED_PREFERENCE_TAGS, serialize_preference_tags

DEMO_PASSWORD = "DemoPass123!"
DEMO_NAME_PREFIX = "Demo Driver"
DEMO_EMAIL_DOMAIN = "demo.uiuc-ride.local"

ROUTES = [
    "UIUC → ORD",
    "ORD → UIUC",
    "UIUC → Midway",
    "UIUC → Downtown Chicago",
]

PICKUP_LOCATIONS = [
    "Illini Union",
    "ISR Bus Stop",
    "Siebel Center",
    "ARC Circle Drive",
    "Lincoln Ave & Green St",
]

VEHICLES = [
    "Toyota Camry",
    "Honda Accord",
    "Hyundai Elantra",
    "Nissan Altima",
    "Subaru Outback",
]

NOTES = [
    "On-time departure, please arrive 10 minutes early.",
    "One medium bag per rider preferred.",
    "Pickup can flex by 10 minutes if needed.",
    "Happy to coordinate a short detour near campus.",
    "Please message if you need accessibility accommodations.",
]


def ensure_demo_columns() -> None:
    Base.metadata.create_all(bind=engine)

    if engine.dialect.name == "postgresql":
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE"))
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT"))
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE"))
            connection.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS price_per_seat DOUBLE PRECISION DEFAULT 0"))
            connection.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS skills TEXT"))
            connection.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS labels TEXT"))
            connection.execute(text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS driver_tier TEXT DEFAULT 'uiuc_verified'"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS phone_number TEXT"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS vehicle_info TEXT"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS sms_verified BOOLEAN DEFAULT FALSE"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS id_upload_status TEXT"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS profile_edit_window_start TIMESTAMP"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS profile_edit_count INTEGER DEFAULT 0"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS profile_edit_cooldown_until TIMESTAMP"))
            connection.execute(text("ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE"))


def generate_departure_time(days_ahead: int, hour: int) -> str:
    departure = datetime.now() + timedelta(days=days_ahead)
    departure = departure.replace(hour=hour, minute=0, second=0, microsecond=0)
    return departure.isoformat()


def cleanup_demo_data(db: Session) -> dict[str, int]:
    deleted_drivers = db.query(Driver).filter(Driver.is_demo == True).delete(synchronize_session=False)
    deleted_applications = db.query(DriverApplication).filter(DriverApplication.is_demo == True).delete(synchronize_session=False)
    deleted_users = db.query(User).filter(User.is_demo == True).delete(synchronize_session=False)
    db.commit()

    return {
        "drivers": deleted_drivers,
        "applications": deleted_applications,
        "users": deleted_users,
    }


def build_preference_tags(offset: int) -> list[str]:
    rotating_pool = ALLOWED_PREFERENCE_TAGS[offset % len(ALLOWED_PREFERENCE_TAGS):] + ALLOWED_PREFERENCE_TAGS[:offset % len(ALLOWED_PREFERENCE_TAGS)]
    return rotating_pool[:2]


def seed_demo_data(db: Session, count: int) -> dict[str, int]:
    password_hash = get_password_hash(DEMO_PASSWORD)
    created_users = 0
    created_applications = 0
    created_drivers = 0

    for index in range(1, count + 1):
        tier = "uiuc_verified" if index % 2 else "community"
        email_verified = tier == "uiuc_verified"
        sms_verified = True
        route = ROUTES[(index - 1) % len(ROUTES)]

        demo_user = User(
            email=f"demo.driver{index}@{DEMO_EMAIL_DOMAIN}",
            name=f"{DEMO_NAME_PREFIX} {index}",
            hashed_password=password_hash,
            is_admin=False,
            is_active=True,
            is_demo=True,
        )
        db.add(demo_user)
        db.flush()
        created_users += 1

        demo_application = DriverApplication(
            user_id=demo_user.id,
            email=demo_user.email,
            full_name=demo_user.name,
            driver_tier=tier,
            phone_number=f"+12175550{index:03d}",
            vehicle_info=VEHICLES[(index - 1) % len(VEHICLES)],
            email_verified=email_verified,
            sms_verified=sms_verified,
            id_upload_status="approved",
            primary_route=route,
            available_seats=2 + (index % 3),
            notes="Demo account for marketplace activity.",
            status="approved",
            is_demo=True,
        )
        db.add(demo_application)
        created_applications += 1

        preference_tags = build_preference_tags(index)
        demo_driver = Driver(
            user_id=demo_user.id,
            route=route,
            vehicle=VEHICLES[(index - 1) % len(VEHICLES)],
            available_seats=2 + (index % 3),
            departure_time=generate_departure_time(days_ahead=(index % 5) + 1, hour=8 + (index % 8)),
            price_per_seat=float(22 + (index % 7) * 3),
            pickup_location=PICKUP_LOCATIONS[(index - 1) % len(PICKUP_LOCATIONS)],
            skills="Careful driver, campus pickup familiar",
            labels=serialize_preference_tags(preference_tags),
            notes=NOTES[(index - 1) % len(NOTES)],
            is_active=True,
            is_demo=True,
        )
        db.add(demo_driver)
        created_drivers += 1

    db.commit()

    return {
        "users": created_users,
        "applications": created_applications,
        "drivers": created_drivers,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Manage demo users and demo driver listings.")
    parser.add_argument(
        "command",
        choices=["refresh", "cleanup"],
        help="refresh: cleanup then seed demo data | cleanup: remove all demo data",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=8,
        help="Number of demo users/listings to seed during refresh (default: 8)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.count < 1:
        raise ValueError("--count must be at least 1")

    ensure_demo_columns()
    db = SessionLocal()
    try:
        removed = cleanup_demo_data(db)
        print(
            f"Removed demo data -> users: {removed['users']}, applications: {removed['applications']}, drivers: {removed['drivers']}"
        )

        if args.command == "refresh":
            seeded = seed_demo_data(db, args.count)
            print(
                f"Seeded demo data -> users: {seeded['users']}, applications: {seeded['applications']}, drivers: {seeded['drivers']}"
            )
            print(f"Demo login password for all demo users: {DEMO_PASSWORD}")
        else:
            print("Cleanup complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
