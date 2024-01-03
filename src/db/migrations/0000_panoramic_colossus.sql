CREATE TABLE IF NOT EXISTS "todos" (
	"todo_id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_checked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT LOCALTIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT LOCALTIMESTAMP CHECK(updated_at >= created_at) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" varchar(25) PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"login" varchar(50) NOT NULL,
	"password" text NOT NULL,
	"avatar_url" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
