import React from "react";
import ChallengeDispatcher from "@/components/ChallengeDispatcher";

interface PageProps {
  params: Promise<{
    module: string;
    topic: string;
    difficulty: string;
  }>;
}

export default async function ChallengeRoutePage({ params }: PageProps) {
  const { module, topic, difficulty } = await params;

  return (
    <ChallengeDispatcher
      module={module}
      topic={topic}
      difficulty={difficulty}
    />
  );
}
