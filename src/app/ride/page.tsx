"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import BookingLocations from "@/components/BookingLocations";

export default function RidePage() {
  const router = useRouter();

  return (
    <PageWrap>
      <BookingLocations onContinue={() => router.push("/drivers")} />
    </PageWrap>
  );
}

const PageWrap = styled.main`
  width: 100%;
  min-height: 65vh;
  padding: 40px 24px;
  background: #FFFCF2;
`;