import Parent from "@/models/ParentsRegistration";
import Driver from "@/models/DriversRegistration";

export async function findUserByEmail(email: string, userType: string) {
  const normalizedEmail = email.toLowerCase();

  if (userType === "admin") {
    return (
      (await Parent.findOne({ email: normalizedEmail, userType: "admin" })) ??
      (await Driver.findOne({ email: normalizedEmail, userType: "admin" }))
    );
  }

  if (userType === "parent") {
    return Parent.findOne({ email: normalizedEmail });
  }

  if (userType === "driver") {
    return Driver.findOne({ email: normalizedEmail });
  }

  return null;
}
