"use client";

import React from "react";
import styled from "styled-components";
import RideRequestWizard from "@/components/RideRequestWizard";

export default function RidePage() {
  return (
    <PageWrap>
      <RideRequestWizard />
    </PageWrap>
  );
}

const PageWrap = styled.main`
  width: 100%;
  min-height: 65vh;
  padding: 40px 24px;
  background: #FFFCF2;
`;