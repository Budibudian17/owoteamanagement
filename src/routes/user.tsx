import { createFileRoute } from "@tanstack/react-router";
import { UserDashboard } from "@/components/owo/UserDashboard";

export const Route = createFileRoute("/user")({
  component: UserDashboard,
});
