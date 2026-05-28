import "dotenv/config";
import "reflect-metadata";
import { AppDataSource } from "../src/db/data-source";
import { UserEntity } from "../src/db/entities/user.entity";
import { EventEntity } from "../src/db/entities/event.entity";
import { EventRsvpEntity } from "../src/db/entities/event-rsvp.entity";
import { EventCommentEntity } from "../src/db/entities/event-comment.entity";

const users = [
  { name: "Alice Chen" },
  { name: "Marcus Rivera" },
  { name: "Priya Sharma" },
  { name: "Jordan Kim" },
];

const events = [
  {
    title: "Weekend Hike in the Hills",
    description: "A relaxed 10 km loop through the forest. Bring water and snacks. Dogs welcome.",
    startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    location: "North Ridge Trailhead",
    userIndex: 0,
  },
  {
    title: "Board Game Night",
    description: "Settlers of Catan, Ticket to Ride, and more. Beginners welcome — we teach the rules.",
    startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    location: "Community Center, Room 4",
    userIndex: 1,
  },
  {
    title: "Morning Yoga in the Park",
    description: "All levels. Bring your own mat. We'll flow for 45 minutes then enjoy coffee together.",
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    location: "Riverside Park, East Lawn",
    userIndex: 2,
  },
  {
    title: "Open Mic Night",
    description: "Poetry, comedy, acoustic music — sign up at the door. 5-minute slots.",
    startsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    location: "The Red Door Cafe",
    userIndex: 3,
  },
  {
    title: "Book Club: Dune",
    description: "We're discussing Frank Herbert's Dune, chapters 1-20. Light refreshments provided.",
    startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    location: "Public Library, Meeting Room B",
    userIndex: 0,
  },
];

async function seed() {
  await AppDataSource.initialize();
  console.log("Database connected");

  const userRepo = AppDataSource.getRepository(UserEntity);
  const eventRepo = AppDataSource.getRepository(EventEntity);
  const rsvpRepo = AppDataSource.getRepository(EventRsvpEntity);
  const commentRepo = AppDataSource.getRepository(EventCommentEntity);

  // Clear existing data in correct order
  await commentRepo.delete({});
  await rsvpRepo.delete({});
  await eventRepo.delete({});
  await userRepo.delete({});

  // Create users
  const createdUsers: UserEntity[] = [];
  for (const userData of users) {
    const user = await userRepo.save(userRepo.create({ name: userData.name }));
    createdUsers.push(user);
    console.log(`  Created user: ${user.name} (${user.id})`);
  }

  // Create events
  const createdEvents: EventEntity[] = [];
  for (const eventData of events) {
    const event = await eventRepo.save(
      eventRepo.create({
        title: eventData.title,
        description: eventData.description,
        startsAt: eventData.startsAt,
        location: eventData.location,
        createdByUserId: createdUsers[eventData.userIndex].id,
      }),
    );
    createdEvents.push(event);
    console.log(`  Created event: ${event.title} (${event.id})`);
  }

  // Create RSVPs
  const rsvpPairs = [
    { eventIndex: 0, userIndex: 0, status: "going" },
    { eventIndex: 0, userIndex: 1, status: "going" },
    { eventIndex: 0, userIndex: 2, status: "maybe" },
    { eventIndex: 1, userIndex: 1, status: "going" },
    { eventIndex: 1, userIndex: 3, status: "going" },
    { eventIndex: 2, userIndex: 2, status: "going" },
    { eventIndex: 2, userIndex: 0, status: "maybe" },
    { eventIndex: 3, userIndex: 3, status: "going" },
    { eventIndex: 4, userIndex: 0, status: "going" },
    { eventIndex: 4, userIndex: 1, status: "not_going" },
  ];

  for (const r of rsvpPairs) {
    await rsvpRepo.save(
      rsvpRepo.create({
        eventId: createdEvents[r.eventIndex].id,
        userId: createdUsers[r.userIndex].id,
        status: r.status,
      }),
    );
  }
  console.log(`  Created ${rsvpPairs.length} RSVPs`);

  // Create comments
  const comments = [
    { eventIndex: 0, userIndex: 1, content: "Can't wait! Should I bring trekking poles?" },
    { eventIndex: 0, userIndex: 2, content: "I'll be a few minutes late — save me a spot." },
    { eventIndex: 1, userIndex: 3, content: "Finally, a Catan night! I call the ore port." },
    { eventIndex: 2, userIndex: 0, content: "Will there be extra mats? Mine is worn out." },
    { eventIndex: 3, userIndex: 0, content: "Is there a sign-up list or first-come-first-served?" },
    { eventIndex: 4, userIndex: 1, content: "I'm only on chapter 10 but I'll try to catch up!" },
  ];

  for (const c of comments) {
    await commentRepo.save(
      commentRepo.create({
        eventId: createdEvents[c.eventIndex].id,
        userId: createdUsers[c.userIndex].id,
        content: c.content,
      }),
    );
  }
  console.log(`  Created ${comments.length} comments`);

  console.log("Seed complete!");
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
