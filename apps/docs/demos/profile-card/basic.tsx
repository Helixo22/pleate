"use client";

import { ProfileCard } from "pleate/effects/profile-card";

export default function Demo() {
  return (
    <ProfileCard
      name="Lena Park"
      title="Product designer"
      handle="lenapark"
      avatarUrl="https://picsum.photos/seed/pl-profile/600/800"
      avatarAlt="Profile photo of Lena Park"
      onContact={() => console.log("contact")}
    />
  );
}
