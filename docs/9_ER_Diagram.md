# FoodConnect Database ER Diagram

This document illustrates the final Entity-Relationship (ER) model for the FoodConnect PostgreSQL Database, visualizing how data connects to maintain system integrity. This reflects the most recent updates containing enriched tracking and profile columns.

## Entity Relationship Visualization

```mermaid
erDiagram
    users ||--o| hotel : "extends (1:1)"
    users ||--o| volunteer : "extends (1:1)"
    
    hotel ||--o{ donations : "posts (1:N)"
    
    donations ||--o{ donation_tags : "has tags (1:N)"
    donations ||--o{ location_tracking : "is tracked (1:N)"
    
    donations ||--o{ claims_record : "is claimed (1:N)"
    volunteer ||--o{ claims_record : "makes claims (1:N)"
    volunteer ||--o{ location_tracking : "broadcasts (1:N)"
    
    claims_record ||--o| verification : "requires (1:1)"

    users {
        bigint user_id PK
        varchar password
        varchar email "UNIQUE"
        varchar phone "UNIQUE"
        varchar role "hotel, volunteer, admin"
        timestamp created_at
    }

    hotel {
        bigint h_id PK
        bigint user_id FK "UNIQUE"
        varchar h_name
        varchar hotel_type "e.g., Bakery, 5-Star"
        varchar contact_name
        text address
        numeric latitude
        numeric longitude
        varchar fssai "UNIQUE"
    }

    volunteer {
        bigint vol_id PK
        bigint user_id FK "UNIQUE"
        varchar vol_name
        integer age
        varchar vehicle_type
        boolean availability_status "defaults TRUE"
        numeric latitude
        numeric longitude
        integer score ">= 0"
    }

    donations {
        bigint d_id PK
        bigint h_id FK
        numeric total_wt "> 0"
        text food_description
        boolean is_veg
        timestamp prep_time
        timestamp exp_time
        timestamp created_at
    }

    donation_tags {
        bigint tag_id PK
        bigint d_id FK "UNIQUE with tag"
        varchar tag "biryani, rice, noodles"
    }

    claims_record {
        bigint c_id PK
        bigint d_id FK
        bigint vol_id FK
        varchar status "pending, accepted, delivered"
        numeric c_wt "> 0"
        timestamp timestamp
    }

    verification {
        bigint ve_id PK
        bigint c_id FK "UNIQUE"
        timestamp exp_time
        varchar pickup_hash
        varchar delivery_hash
        timestamp verified_at
    }

    location_tracking {
        bigint id PK
        bigint volunteer_id FK
        bigint donation_id FK
        decimal latitude
        decimal longitude
        real accuracy
        timestamp timestamp
    }
```

## Structural Design Notes

1.  **Identity Management**: The `users` table acts as the master identifier. The `hotel` and `volunteer` tables map exclusively to a single user (`UNIQUE ForeignKey`), allowing polymorphic-like behavior for authentication routing.
2.  **Referential Integrity Constraints (Cascades)**: Data deletion flows downward. E.g., if a `hotel` account is deleted, the cascade destroys their `donations`, which subsequently destroys any `donation_tags` or `claims_record` attached to that specific donation, ensuring no orphaned data remains.
3.  **Strict State Control**: Entities like `claims_record.status` and `donation_tags.tag` are heavily constrained using `CHECK` variables directly on the database level rather than just depending on API validation, providing an unalterable source of truth.
4.  **Transaction Security**: `verification` uses a 1:1 map to `claims_record` (`UNIQUE c_id`), serving as the physical OTP handshake locker required before a claim's status can shift to `delivered`.
5.  **Location Analytics**: The `location_tracking` table aggregates a breadcrumb trail tightly coupled to both the executing `volunteer` and the active `donation` payload, mapping out accurate operational history.
