import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { Reveal } from "../components/Reveal";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

export function EventsListPage() {
  const user = useSessionStore((state) => state.user);
  const events = useEventsStore((state) => state.events);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const loadEvents = useEventsStore((state) => state.loadEvents);
  const subscribeToEvents = useEventsStore((state) => state.subscribeToEvents);
  const unsubscribeFromEvents = useEventsStore((state) => state.unsubscribeFromEvents);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  useEffect(() => {
    const filters: { search?: string; dateFrom?: string; dateTo?: string } = {};
    if (search.trim()) filters.search = search.trim();
    if (dateRange[0]) filters.dateFrom = dateRange[0].toISOString();
    if (dateRange[1]) filters.dateTo = dateRange[1].toISOString();
    void loadEvents(filters);
  }, [loadEvents, search, dateRange]);

  useEffect(() => {
    subscribeToEvents();
    return () => {
      unsubscribeFromEvents();
    };
  }, [subscribeToEvents, unsubscribeFromEvents]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box>
      <Reveal>
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Box>
            <Badge
              color="blue"
              variant="light"
              style={{
                background: "var(--color-pastel-blue)",
                color: "var(--color-pastel-blue-ink)",
              }}
            >
              Events
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
              What is coming up
            </Title>
          </Box>
          <Button
            component={Link}
            to="/events/new"
            color="accent"
            leftSection={null}
          >
            Create event
          </Button>
        </Group>
      </Reveal>

      <Reveal>
        <Card withBorder mt="xl" radius="xl" p="md" style={{ background: "var(--color-surface)" }}>
          <Group gap="md" wrap="wrap">
            <TextInput
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ flex: 1, minWidth: 200 }}
              styles={{ input: { background: "var(--color-surface-raised)" } }}
            />
            <DatePickerInput
              type="range"
              placeholder="Filter by date"
              value={dateRange}
              onChange={(val) => {
                if (val) {
                  const [start, end] = val as unknown as [string | null, string | null];
                  setDateRange([start ? new Date(start) : null, end ? new Date(end) : null]);
                } else {
                  setDateRange([null, null]);
                }
              }}
              clearable
              style={{ minWidth: 260 }}
              styles={{ input: { background: "var(--color-surface-raised)" } }}
            />
          </Group>
        </Card>
      </Reveal>

      {isLoading ? (
        <SimpleGrid cols={{ base: 1, md: 2 }} mt="xl" spacing="md">
          {[...Array(4)].map((_, i) => (
            <Card withBorder key={i} radius="xl">
              <Skeleton height={28} width="66%" radius="xl" />
              <Skeleton height={16} mt="sm" radius="lg" />
              <Skeleton height={16} mt="xs" width="80%" radius="lg" />
              <Group mt="lg" gap="xs">
                <Skeleton height={16} width="50%" radius="lg" />
                <Skeleton height={16} width="33%" radius="lg" />
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      ) : null}

      {error ? (
        <Alert
          mt="xl"
          color="red"
          variant="light"
          radius="xl"
          style={{
            background: "var(--color-pastel-red)",
            color: "var(--color-pastel-red-ink)",
            borderColor: "var(--color-pastel-red-ink)",
          }}
        >
          <Text fw={600}>{error}</Text>
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, md: 2 }} mt="xl" spacing="md">
        {events.map((event, index) => (
          <Reveal key={event.id} index={index}>
            <Card
              component={Link}
              to={`/events/${event.id}`}
              withBorder
              radius="xl"
              style={{
                background: "var(--color-surface)",
                transition:
                  "transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms ease",
                textDecoration: "none",
                color: "inherit",
              }}
              className="event-card"
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Box style={{ minWidth: 0 }}>
                  <Title
                    order={3}
                    size="h4"
                    style={{ transition: "color 200ms ease" }}
                  >
                    {event.title}
                  </Title>
                  <Text
                    size="sm"
                    c="dimmed"
                    mt="xs"
                    lineClamp={2}
                    style={{ lineHeight: 1.65 }}
                  >
                    {event.description}
                  </Text>
                </Box>
                <Badge
                  color="yellow"
                  variant="light"
                  style={{
                    background: "var(--color-pastel-yellow)",
                    color: "var(--color-pastel-yellow-ink)",
                    flexShrink: 0,
                  }}
                >
                  {event.participantCount} joined
                </Badge>
              </Group>

              <Group mt="lg" gap="md" wrap="wrap">
                <Text
                  size="xs"
                  c="dimmed"
                  fw={500}
                  ff="var(--font-mono)"
                >
                  {new Date(event.startsAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text
                  size="xs"
                  c="dimmed"
                  fw={500}
                  ff="var(--font-mono)"
                >
                  {event.location}
                </Text>
                <Text
                  size="xs"
                  c="dimmed"
                  fw={500}
                  ff="var(--font-mono)"
                >
                  Hosted by {event.createdBy.name}
                </Text>
              </Group>
            </Card>
          </Reveal>
        ))}
      </SimpleGrid>

      {!isLoading && events.length === 0 ? (
        <Reveal>
          <Card
            withBorder
            mt="xl"
            p="3rem"
            radius="xl"
            style={{
              borderStyle: "dashed",
              textAlign: "center",
              background: "var(--color-surface)",
            }}
          >
            <Box
              mx="auto"
              style={{
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-raised)",
              }}
            >
              <Box
                style={{
                  width: 10,
                  height: 10,
                  transform: "rotate(45deg)",
                  borderRadius: 3,
                  background: "var(--color-ink)",
                }}
              />
            </Box>
            <Title order={2} size="h4" mt="md">
              No events yet
            </Title>
            <Text c="dimmed" mt="xs" style={{ maxWidth: 320 }} mx="auto">
              Create the first event for the community and start bringing
              people together.
            </Text>
            <Button
              component={Link}
              to="/events/new"
              color="accent"
              mt="lg"
            >
              Create event
            </Button>
          </Card>
        </Reveal>
      ) : null}
    </Box>
  );
}
