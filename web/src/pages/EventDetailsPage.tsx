import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
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
  const setRsvp = useEventsStore((state) => state.setRsvp);
  const removeRsvp = useEventsStore((state) => state.removeRsvp);
  const createComment = useEventsStore((state) => state.createComment);
  const deleteComment = useEventsStore((state) => state.deleteComment);
  const [commentText, setCommentText] = useState("");

  if (!id) {
    return <Navigate to="/events" replace />;
  }

  const eventId = id;

  useEffect(() => {
    void loadEvent(eventId);
  }, [eventId, loadEvent]);

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  const authToken = token;

  const myRsvp = selectedEvent?.rsvps.find((r) => r.user.id === user.id);
  const isHost = selectedEvent?.createdBy.id === user.id;

  const goingUsers =
    selectedEvent?.rsvps.filter((r) => r.status === "going").map((r) => r.user) ?? [];
  const maybeUsers =
    selectedEvent?.rsvps.filter((r) => r.status === "maybe").map((r) => r.user) ?? [];

  async function handleRsvpChange(status: string) {
    if (status === "none") {
      await removeRsvp(eventId, authToken);
    } else {
      await setRsvp(eventId, authToken, status as "going" | "maybe" | "not_going");
    }
  }

  async function handlePostComment() {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    await createComment(eventId, authToken, trimmed);
    setCommentText("");
  }

  function handleDeleteComment(commentId: string) {
    void deleteComment(eventId, commentId, authToken);
  }

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
                    style={{
                      letterSpacing: "0.05em",
                      color: "var(--color-subtle)",
                    }}
                  >
                    When
                  </Text>
                  <Text
                    mt="xs"
                    size="sm"
                    fw={700}
                    style={{ lineHeight: 1.4 }}
                  >
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
                    style={{
                      letterSpacing: "0.05em",
                      color: "var(--color-subtle)",
                    }}
                  >
                    Where
                  </Text>
                  <Text
                    mt="xs"
                    size="sm"
                    fw={700}
                    style={{ lineHeight: 1.4 }}
                  >
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
                    style={{
                      letterSpacing: "0.05em",
                      color: "var(--color-subtle)",
                    }}
                  >
                    Host
                  </Text>
                  <Text
                    mt="xs"
                    size="sm"
                    fw={700}
                    style={{ lineHeight: 1.4 }}
                  >
                    {selectedEvent.createdBy.name}
                  </Text>
                </Card>
              </SimpleGrid>

              {/* Comments */}
              <Box mt="xl">
                <Title order={3} size="h4">
                  Comments
                </Title>
                <Text size="sm" c="dimmed" mt="xs">
                  {selectedEvent.comments.length} comments
                </Text>

                <Stack mt="md" gap="sm">
                  {selectedEvent.comments.map((comment) => (
                    <Box
                      key={comment.id}
                      p="sm"
                      style={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface-raised)",
                      }}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Group gap="xs">
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
                            {comment.user.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Text size="sm" fw={600}>
                              {comment.user.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </Box>
                        </Group>
                        {(comment.user.id === user.id || isHost) && (
                          <Button
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </Group>
                      <Text size="sm" mt="xs" style={{ whiteSpace: "pre-line" }}>
                        {comment.content}
                      </Text>
                    </Box>
                  ))}
                </Stack>

                <Textarea
                  mt="md"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(event) => setCommentText(event.currentTarget.value)}
                  minRows={2}
                  maxRows={6}
                  styles={{
                    input: { background: "var(--color-surface-raised)" },
                  }}
                />
                <Button
                  mt="xs"
                  color="accent"
                  disabled={!commentText.trim()}
                  onClick={handlePostComment}
                >
                  Post comment
                </Button>
              </Box>
            </Card>
          </Reveal>

          <Reveal index={1}>
            <Stack gap="md">
              <Card
                withBorder
                radius="xl"
                p="xl"
                style={{ background: "var(--color-surface)" }}
              >
                <Title order={2} size="h4">
                  Your response
                </Title>
                <Text size="sm" c="dimmed" mt="xs">
                  {goingUsers.length} going · {maybeUsers.length} maybe ·{" "}
                  {selectedEvent.rsvps.filter((r) => r.status === "not_going").length} not going
                </Text>

                <SegmentedControl
                  fullWidth
                  mt="lg"
                  value={myRsvp?.status ?? "none"}
                  onChange={handleRsvpChange}
                  data={[
                    { label: "Going", value: "going" },
                    { label: "Maybe", value: "maybe" },
                    { label: "Not going", value: "not_going" },
                    ...(myRsvp ? [{ label: "Leave", value: "none" }] : []),
                  ]}
                  color="accent"
                  style={{ background: "var(--color-surface-raised)" }}
                />
              </Card>

              <Card
                withBorder
                radius="xl"
                p="xl"
                style={{ background: "var(--color-surface)" }}
              >
                <Title order={2} size="h4">
                  Going
                </Title>
                <Text size="sm" c="dimmed" mt="xs">
                  {goingUsers.length} people
                </Text>

                <Box mt="lg">
                  {goingUsers.map((participant) => (
                    <Group
                      key={participant.id}
                      gap="sm"
                      p="sm"
                      mt="xs"
                      className="participant-row"
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
                  {goingUsers.length === 0 ? (
                    <Text c="dimmed" size="sm" ta="center" py="md">
                      No one is going yet. Be the first!
                    </Text>
                  ) : null}
                </Box>
              </Card>

              {maybeUsers.length > 0 ? (
                <Card
                  withBorder
                  radius="xl"
                  p="xl"
                  style={{ background: "var(--color-surface)" }}
                >
                  <Title order={2} size="h4">
                    Maybe
                  </Title>
                  <Text size="sm" c="dimmed" mt="xs">
                    {maybeUsers.length} people
                  </Text>

                  <Box mt="lg">
                    {maybeUsers.map((participant) => (
                      <Group
                        key={participant.id}
                        gap="sm"
                        p="sm"
                        mt="xs"
                        className="participant-row"
                        style={{
                          borderRadius: 8,
                          border: "1px solid var(--color-border)",
                          background: "var(--color-surface-raised)",
                        }}
                      >
                        <Avatar
                          size="sm"
                          radius="md"
                          color="yellow"
                          style={{
                            background: "var(--color-pastel-yellow)",
                            color: "var(--color-pastel-yellow-ink)",
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
                  </Box>
                </Card>
              ) : null}
            </Stack>
          </Reveal>
        </SimpleGrid>
      ) : null}
    </Box>
  );
}
