import { FormEvent, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Grid,
  Divider,
  Paper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Reveal } from "../components/Reveal";
import { useSessionStore } from "../stores/sessionStore";

const HAS_GOOGLE_OAUTH = Boolean(
  (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").length,
);

export function HomePage() {
  const navigate = useNavigate();
  const [demoName, setDemoName] = useState("");
  const loginWithGoogle = useSessionStore((state) => state.loginWithGoogle);
  const loginDemo = useSessionStore((state) => state.loginDemo);
  const isLoading = useSessionStore((state) => state.isLoading);
  const error = useSessionStore((state) => state.error);
  const isDemoValid = demoName.trim().length > 0;

  async function handleDemoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDemoValid) return;

    await loginDemo(demoName.trim());

    if (useSessionStore.getState().token) {
      navigate("/events");
    }
  }

  async function handleGoogleSuccess(credential: string | undefined) {
    if (!credential) return;
    await loginWithGoogle(credential);

    if (useSessionStore.getState().token) {
      navigate("/events");
    }
  }

  return (
    <Box
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box
        maw="64rem"
        mx="auto"
        px={{ base: "md", sm: "xl" }}
        py="xl"
        style={{ width: "100%" }}
      >
        <Grid gutter="xl" align="center">
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Reveal>
              <Badge
                color="green"
                variant="light"
                style={{
                  background: "var(--color-pastel-green)",
                  color: "var(--color-pastel-green-ink)",
                }}
              >
                Local events
              </Badge>
              <Title
                order={1}
                mt="lg"
                maw={720}
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(3rem, 6vw, 5rem)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.045em",
                  textWrap: "balance",
                }}
              >
                Find the room where things are happening.
              </Title>
              <Text
                mt="lg"
                size="lg"
                style={{
                  maxWidth: 520,
                  lineHeight: 1.65,
                  textWrap: "pretty",
                }}
                c="dimmed"
              >
                Create small gatherings, discover what others are hosting, and
                join events with a saved account.
              </Text>
            </Reveal>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Reveal index={1}>
              <Paper
                withBorder
                p="xl"
                radius="xl"
                style={{ background: "var(--color-surface)" }}
              >
                <Title order={2} size="h3">
                  {HAS_GOOGLE_OAUTH ? "Get started" : "Try the app"}
                </Title>
                <Text size="sm" c="dimmed" mt="xs">
                  {HAS_GOOGLE_OAUTH
                    ? "Sign in with Google or enter a name to try the app."
                    : "Enter your name to create a demo account. No password needed."}
                </Text>

                {HAS_GOOGLE_OAUTH ? (
                  <>
                    <Box mt="xl">
                      <GoogleLogin
                        onSuccess={(credentialResponse) => {
                          void handleGoogleSuccess(credentialResponse.credential);
                        }}
                        onError={() => {
                          useSessionStore.getState().signOut();
                        }}
                        width="100%"
                        shape="rectangular"
                        theme="outline"
                        text="signin_with"
                        size="large"
                      />
                    </Box>

                    <Divider
                      label="or try demo mode"
                      labelPosition="center"
                      my="xl"
                      color="var(--color-border)"
                    />
                  </>
                ) : null}

                <form onSubmit={handleDemoSubmit}>
                  <TextInput
                    label="Your name"
                    placeholder="e.g. Mira Patel"
                    value={demoName}
                    onChange={(event) =>
                      setDemoName(event.currentTarget.value)
                    }
                    autoComplete="name"
                    styles={{
                      input: {
                        background: "var(--color-surface-raised)",
                      },
                    }}
                  />

                  <Text
                    mt="md"
                    size="sm"
                    fw={600}
                    style={{
                      minHeight: 40,
                      color: error
                        ? "var(--color-pastel-red-ink)"
                        : "transparent",
                      opacity: error ? 1 : 0,
                      transition: "opacity 200ms ease",
                    }}
                    role="status"
                    aria-live="polite"
                  >
                    {error ?? " "}
                  </Text>

                  <Button
                    type="submit"
                    fullWidth
                    mt="xs"
                    color="accent"
                    disabled={isLoading || !isDemoValid}
                    loading={isLoading}
                  >
                    Enter as demo user
                  </Button>
                </form>
              </Paper>
            </Reveal>
          </Grid.Col>
        </Grid>
      </Box>
    </Box>
  );
}
