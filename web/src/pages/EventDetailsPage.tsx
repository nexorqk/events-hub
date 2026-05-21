import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Text,
  Title,
} from "@mantine/core";
import { Reveal } from "../components/Reveal";
import { useEventsStore } from "../stores/eventsStore";
import { useSessionStore } from "../stores/sessionStore";

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useSessionStore((state) => state.user);
  const token = useSessionStore((state) => state.token);
  const selectedEvent = useEventsStore((state) => state.selectedEvent);
  const isLoading = useEventsStore((state) => state.isLoading);
  const error = useEventsStore((state) => state.error);
  const loadEvent = useEventsStore((state) => state.loadEvent);
  const joinEvent = useEventsStore((state) => state.joinEvent);
  const leaveEvent = useEventsStore((state) => state.leaveEvent);

  useEffect(() => {
    if (id) {
      void loadEvent(id);
    }
  }, [id, loadEvent]);

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  if (!id) {
    return <Navigate to="/events" replace />;
  }

  const isParticipant =
    selectedEvent?.participants.some(
      (participant) => participant.id === user.id,
    ) ?? false;
  const isHost = selectedEvent?.createdBy.id === user.id;

  return (
    <Box>
      <Button
        component={Link}
        to="/events"
        variant="subtle"
        color="gray"
        size="sm"
        radius="md"
        fw={600}
        leftSection={
          <Text span style={{ fontSize: 14 }}>
            ←
          </Text>
        }
      >
        Back to events
      </Button>

      {isLoading ? (
        <Card withBorder mt="xl" radius="xl" p="xl">
          <Skeleton height={24} width={96} radius="lg" />
          <Skeleton height={48} mt="md" width="75%" radius="lg" />
          <Box mt="lg">
            <Skeleton height={16} radius="lg" />
            <Skeleton height={16} mt="xs" width="83%" radius="lg" />
            <Skeleton height={16} mt="xs" width="66%" radius="lg" />
          </Box>
        </Card>
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

      {selectedEvent ? (
        <SimpleGrid cols={{ base: 1, lg: 2 }} mt="xl" spacing="md">
          <Reveal>
            <Card
              withBorder
              radius="xl"
              p="xl"
              style={{ background: "var(--color-surface)" }}
            >
              <Group justify="space-between" align="center" wrap="wrap">
                <Badge
                  color="blue"
                  variant="light"
                  style={{
                    background: "var(--color-pastel-blue)",
                    color: "var(--color-pastel-blue-ink)",
                  }}
                >
                  Event
                </Badge>
                {isHost ? (
                  <Button
                    component={Link}
                    to={`/events/${selectedEvent.id}/edit`}
                    variant="default"
                    size="sm"
                    radius="md"
                    fw={600}
                  >
                    Edit event
                  </Button>
                ) : null}
              </Group>

              <Title
                order={1}
                mt="md"
                maw={720}
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                  textWrap: "balance",
                }}
              >
                {selectedEvent.title}
              </Title>
              <Text
                mt="xl"
                style={{
                  whiteSpace: "pre-line",
                  lineHeight: 1.65,
                  fontSize: "clamp(1rem, 1.2vw, 1.125rem)",
                }}
                c="dimmed"
              >
                {selectedEvent.description}
              </Text>

              <SimpleGrid cols={{ base: 1, sm: 3 }} mt="xl" spacing="md">
                <Card
                  withBorder
                  radius="xl"
                  p="md"
                  style={{ background: "var(--color-surface-raised)" }}
                >
                  <Text
                    size="xs"
                    ff="var(--font-mono)"
                    fw={700}
                    tt="uppercase"
                    style={{ letterSpacing: "0.05em", color: "var(--color-subtle)" }}
                  >
                    When
                  </Text>
                  <Text mt="xs" size="sm" fw={700} style={{ lineHeight: 1.4 }}>
                    {new Date(selectedEvent.startsAt).toLocaleString(
                      undefined,
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </Text>
                </Card>
                <Card
                  withBorder
                  radius="xl"
                  p="md"
                  style={{ background: "var(--color-surface-raised)" }}
                >
                  <Text
                    size="xs"
                    ff="var(--font-mono)"
                    fw={700}
                    tt="uppercase"
                    style={{ letterSpacing: "0.05em", color: "var(--color-subtle)" }}
                  >
                    Where
                  </Text>
                  <Text mt="xs" size="sm" fw={700} style={{ lineHeight: 1.4 }}>
                    {selectedEvent.location}
                  </Text>
                </Card>
                <Card
                  withBorder
                  radius="xl"
                  p="md"
                  style={{ background: "var(--color-surface-raised)" }}
                >
                  <Text
                    size="xs"
                    ff="var(--font-mono)"
                    fw={700}
                    tt="uppercase"
                    style={{ letterSpacing: "0.05em", color: "var(--color-subtle)" }}
                  >
                    Host
                  </Text>
                  <Text mt="xs" size="sm" fw={700} style={{ lineHeight: 1.4 }}>
                    {selectedEvent.createdBy.name}
                  </Text>
                </Card>
              </SimpleGrid>
            </Card>
          </Reveal>

          <Reveal index={1}>
            <Card
              withBorder
              radius="xl"
              p="xl"
              style={{ background: "var(--color-surface)" }}
            >
              <Title order={2} size="h4">
                Participants
              </Title>
              <Text size="sm" c="dimmed" mt="xs">
                {selectedEvent.participants.length} joined
              </Text>

              <Button
                fullWidth
                mt="lg"
                disabled={isLoading}
                loading={isLoading}
                color={isParticipant ? "gray" : "accent"}
                variant={isParticipant ? "default" : "filled"}
                onClick={() => {
                  if (isParticipant) {
                    void leaveEvent(selectedEvent.id, token);
                  } else {
                    void joinEvent(selectedEvent.id, token);
                  }
                }}
              >
                {isParticipant ? "Leave event" : "Join event"}
              </Button>

              <Box mt="lg">
                {selectedEvent.participants.map((participant) => (
                  <Group
                    key={participant.id}
                    gap="sm"
                    p="sm"
                    mt="xs"
                    style={{
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-raised)",
                    }}
                  >
                    <Avatar
                      size="sm"
                      radius="md"
                      color="green"
                      style={{
                        background: "var(--color-pastel-green)",
                        color: "var(--color-pastel-green-ink)",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text size="sm" fw={600}>
                      {participant.name}
                    </Text>
                  </Group>
                ))}
                {selectedEvent.participants.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">
                    No participants yet. Be the first to join.
                  </Text>
                ) : null}
              </Box>
            </Card>
          </Reveal>
        </SimpleGrid>
      ) : null}
    </Box>
  );
}
