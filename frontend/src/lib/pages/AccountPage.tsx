import { useAuthGuard } from "../hooks/useAuthGuard";

export default function AccountPage() {
  useAuthGuard();
  return <h1>My account</h1>;
}
