import { AnimatePresence } from "framer-motion";
import {
  Box,
  Button,
  Divider,
  Group,
  Paper,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { Link, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { useSessionStore } from "../stores/sessionStore";
import { PageTransition } from "./PageTransition";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const user = useSessionStore((state) => state.user);
  const token = useSessionStore((state) => state.token);
  const signOut = useSessionStore((state) => state.signOut);
  const isSignedIn = Boolean(user && token);

  const isEvents = location.pathname === "/events";
  const isNewEvent = location.pathname === "/events/new";

  return (
    <Box style={{ minHeight: "100dvh", background: "var(--color-bg)" }}>
      <Box
        pos="fixed"
        left="50%"
        top="1rem"
        style={{
          zIndex: 50,
          width: "calc(100% - 2rem)",
          maxWidth: "64rem",
          transform: "translateX(-50%)",
        }}
      >
        <Paper
          withBorder
          px="md"
          py="sm"
          radius="xl"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Text
              component={Link}
              to="/events"
              ff="var(--font-serif)"
              fz="xl"
              fw={600}
              style={{ letterSpacing: "-0.03em", color: "var(--color-ink)" }}
            >
              Events Hub
            </Text>

            <Group gap="xs" wrap="nowrap">
              <Button
                component={Link}
                to="/events"
                variant={isEvents ? "filled" : "subtle"}
                color={isEvents ? "dark" : "gray"}
                radius="md"
                size="sm"
                fw={600}
              >
                Events
              </Button>
              <Button
                component={Link}
                to="/events/new"
                variant={isNewEvent ? "filled" : "subtle"}
                color={isNewEvent ? "dark" : "gray"}
                radius="md"
                size="sm"
                fw={600}
              >
                Create
              </Button>

              <Divider orientation="vertical" mx={4} />

              {isSignedIn && user ? (
                <>
                  <Text
                    fz="sm"
                    c="dimmed"
                    style={{ maxWidth: 140 }}
                    lineClamp={1}
                    visibleFrom="sm"
                  >
                    {user.name}
                  </Text>
                  <Button
                    variant="default"
                    size="sm"
                    radius="md"
                    fw={600}
                    onClick={() => {
                      signOut();
                      navigate("/");
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : null}
            </Group>
          </Group>
        </Paper>
      </Box>

      <Box maw="64rem" mx="auto" px="xl" pt="7rem" pb="8rem">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>{outlet}</PageTransition>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
