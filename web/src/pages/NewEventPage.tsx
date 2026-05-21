import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { Reveal } from "../components/Reveal";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

type EventFormPageProps = {
  mode?: "create" | "edit";
};

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
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
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const isEditing = mode === "edit";
  const isFormValid = title.trim() && startsAt;

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
    setStartsAt(toDateTimeLocalValue(selectedEvent.startsAt));
    setLocation(selectedEvent.location);
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

    if (!token || !isFormValid) {
      return;
    }

    let isoDate: string;
    try {
      isoDate = new Date(startsAt).toISOString();
    } catch {
      setDateError("Invalid date and time");
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

              <Group grow align="flex-start" wrap="wrap">
                <TextInput
                  label="Date and time"
                  description="When does the event start? Pick a date and time."
                  type="datetime-local"
                  withAsterisk
                  required
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.currentTarget.value)}
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
              </Group>
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
