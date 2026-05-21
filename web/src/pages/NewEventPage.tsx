import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Card,
  Chip,
  Group,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import { Reveal } from "../components/Reveal";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

type EventFormPageProps = {
  mode?: "create" | "edit";
};

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

function toIsoString(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result.toISOString();
}

function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function getNextWeekend(): Date {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSaturday = day === 6 ? 7 : (6 - day + 7) % 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  return d;
}

function getNextWeek(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

export function NewEventPage({ mode = "create" }: EventFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useSessionStore((state) => state.user);
  const token = useSessionStore((state) => state.token);
  const selectedEvent = useEventsStore((state) => state.selectedEvent);
  const loadEvent = useEventsStore((state) => state.loadEvent);
  const createEvent = useEventsStore((state) => state.createEvent);
  const updateEvent = useEventsStore((state) => state.updateEvent);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventTime, setEventTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const isEditing = mode === "edit";
  const isFormValid = title.trim() && eventDate;

  useEffect(() => {
    if (isEditing && id) {
      void loadEvent(id);
    }
  }, [id, isEditing, loadEvent]);

  useEffect(() => {
    if (!isEditing || !selectedEvent || selectedEvent.id !== id) {
      return;
    }

    setTitle(selectedEvent.title);
    setDescription(selectedEvent.description);
    setLocation(selectedEvent.location);
    const date = new Date(selectedEvent.startsAt);
    setEventDate(date);
    setEventTime(formatTime(date));
  }, [id, isEditing, selectedEvent]);

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  if (isEditing && !id) {
    return <Navigate to="/events" replace />;
  }

  if (
    isEditing &&
    selectedEvent &&
    selectedEvent.id === id &&
    selectedEvent.createdBy.id !== user.id
  ) {
    return <Navigate to={`/events/${selectedEvent.id}`} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !isFormValid || !eventDate) {
      return;
    }

    let isoDate: string;
    try {
      isoDate = toIsoString(eventDate, eventTime);
    } catch {
      setDateError("Invalid date or time");
      return;
    }

    setDateError(null);

    const payload = {
      title,
      description,
      startsAt: isoDate,
      location,
    };

    const savedEvent = isEditing
      ? id
        ? await updateEvent(id, token, payload)
        : null
      : await createEvent(token, payload);

    if (savedEvent) {
      navigate(`/events/${savedEvent.id}`);
    }
  }

  if (isEditing && isLoading && selectedEvent?.id !== id) {
    return (
      <Card withBorder radius="xl" p="xl" maw="48rem" mx="auto">
        <Skeleton height={24} width={112} radius="lg" />
        <Skeleton height={48} mt="md" width="66%" radius="lg" />
        <Stack mt="xl" gap="md">
          <Skeleton height={56} radius="lg" />
          <Skeleton height={128} radius="lg" />
          <Skeleton height={56} radius="lg" />
        </Stack>
      </Card>
    );
  }

  return (
    <Reveal>
      <Box maw="48rem" mx="auto">
        <Badge
          color="green"
          variant="light"
          style={{
            background: "var(--color-pastel-green)",
            color: "var(--color-pastel-green-ink)",
          }}
        >
          {isEditing ? "Edit" : "Create"}
        </Badge>
        <Title
          order={1}
          mt="xs"
          maw={720}
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            textWrap: "balance",
          }}
        >
          {isEditing ? "Edit event" : "Host a new event"}
        </Title>

        <Card
          withBorder
          mt="xl"
          radius="xl"
          p="xl"
          style={{ background: "var(--color-surface)" }}
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Title"
                description="A short, catchy name that tells people what this event is about."
                placeholder="e.g. Weekend Hike in the Hills"
                withAsterisk
                required
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                styles={{
                  input: { background: "var(--color-surface-raised)" },
                }}
              />

              <Textarea
                label="Description"
                description="Optional. Explain what will happen, who should come, and anything guests should know."
                placeholder="e.g. A relaxed 10 km loop through the forest. Bring water and comfortable shoes. We'll meet at the main entrance and finish with a picnic."
                value={description}
                onChange={(event) =>
                  setDescription(event.currentTarget.value)
                }
                rows={5}
                styles={{
                  input: { background: "var(--color-surface-raised)" },
                }}
              />

              <Box>
                <DatePickerInput
                  label="Date"
                  description="Pick a date for your event."
                  placeholder="Pick date"
                  value={eventDate}
                  onChange={setEventDate}
                  withAsterisk
                  required
                  minDate={new Date()}
                  firstDayOfWeek={1}
                  styles={{
                    input: { background: "var(--color-surface-raised)" },
                  }}
                />

                <Group mt="xs" gap="xs">
                  <Chip
                    checked={false}
                    onChange={() => setEventDate(new Date())}
                    variant="light"
                  >
                    Today
                  </Chip>
                  <Chip
                    checked={false}
                    onChange={() => setEventDate(getTomorrow())}
                    variant="light"
                  >
                    Tomorrow
                  </Chip>
                  <Chip
                    checked={false}
                    onChange={() => setEventDate(getNextWeekend())}
                    variant="light"
                  >
                    Next weekend
                  </Chip>
                  <Chip
                    checked={false}
                    onChange={() => setEventDate(getNextWeek())}
                    variant="light"
                  >
                    Next week
                  </Chip>
                </Group>
              </Box>

              <TimeInput
                label="Time"
                description="What time does it start?"
                value={eventTime}
                onChange={(event) => setEventTime(event.currentTarget.value)}
                withAsterisk
                required
                styles={{
                  input: { background: "var(--color-surface-raised)" },
                }}
              />

              <TextInput
                label="Location"
                description="Optional. Where should people go? An address, venue name, or link works."
                placeholder="e.g. Central Park, Main Entrance"
                value={location}
                onChange={(event) => setLocation(event.currentTarget.value)}
                styles={{
                  input: { background: "var(--color-surface-raised)" },
                }}
              />
            </Stack>

            {error ? (
              <Card
                mt="md"
                p="md"
                radius="xl"
                withBorder
                style={{
                  background: "var(--color-pastel-red)",
                  borderColor: "var(--color-pastel-red-ink)",
                }}
              >
                <Text size="sm" fw={600} style={{ color: "var(--color-pastel-red-ink)" }}>
                  {error}
                </Text>
              </Card>
            ) : null}

            {dateError ? (
              <Card
                mt="md"
                p="md"
                radius="xl"
                withBorder
                style={{
                  background: "var(--color-pastel-red)",
                  borderColor: "var(--color-pastel-red-ink)",
                }}
              >
                <Text size="sm" fw={600} style={{ color: "var(--color-pastel-red-ink)" }}>
                  {dateError}
                </Text>
              </Card>
            ) : null}

            <Group mt="xl" gap="md">
              <Button
                type="submit"
                color="accent"
                disabled={isLoading || !isFormValid}
                loading={isLoading}
              >
                {isLoading
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save changes"
                    : "Create event"}
              </Button>
              <Button
                component={Link}
                to={isEditing && id ? `/events/${id}` : "/events"}
                variant="subtle"
                color="gray"
              >
                Cancel
              </Button>
            </Group>
          </form>
        </Card>
      </Box>
    </Reveal>
  );
}
