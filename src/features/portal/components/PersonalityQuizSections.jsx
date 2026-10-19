import { Button, Space } from "antd";
import { PageHero, SectionCard, SoftTag, Text } from "../../../components/ui";
import { personalityQuestions, personalityTypes } from "../../../data/careermapData";

export function PersonalityQuizQuestion({
    personalityStep,
    answers,
    setAnswers,
    setShowPersonality,
    setPersonalityStep,
    setComplete,
}) {
    const currentQuestion = personalityQuestions[personalityStep];

    return (
        <div className="space-y-6">
            <PageHero backOnly onBack={() => setShowPersonality(false)} />
            <SectionCard title={`Question ${personalityStep + 1} of ${personalityQuestions.length}`}>
                <div className="space-y-5">
                    <div className="text-xl font-black text-ink">{currentQuestion.q}</div>
                    <div className="grid gap-3">
                        {currentQuestion.options.map((option, index) => (
                            <Button
                                key={option}
                                block
                                size="large"
                                type={answers[personalityStep] === index ? "primary" : "default"}
                                className="!h-auto !rounded-2xl !py-4 !text-left"
                                onClick={() => {
                                    const next = [...answers];
                                    next[personalityStep] = index;
                                    setAnswers(next);
                                }}
                            >
                                {String.fromCharCode(65 + index)}. {option}
                            </Button>
                        ))}
                    </div>
                    <div className="flex justify-between">
                        <Button onClick={() => setShowPersonality(false)}>Back to Dashboard</Button>
                        <Button
                            type="primary"
                            disabled={answers[personalityStep] === null}
                            onClick={() => {
                                if (personalityStep === personalityQuestions.length - 1) {
                                    setComplete(true);
                                } else {
                                    setPersonalityStep((step) => step + 1);
                                }
                            }}
                        >
                            {personalityStep === personalityQuestions.length - 1 ? "See Results" : "Next"}
                        </Button>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}

export function PersonalityQuizResults({ personalityResult, setShowPersonality, navigate }) {
    return (
        <div className="space-y-6">
            <PageHero backOnly onBack={() => setShowPersonality(false)} />
            <SectionCard title="Recommended Careers">
                <Space wrap>
                    {personalityResult.careers.map((career) => (
                        <SoftTag key={career} color="red">
                            {career}
                        </SoftTag>
                    ))}
                </Space>
            </SectionCard>
            <SectionCard title="Next Step">
                <Space direction="vertical">
                    <Text>Take the deeper assessment to unlock a richer career report with stronger recommendations.</Text>
                    <Button type="primary" onClick={() => navigate("/app/assessment")}>
                        Take Full Psychometric Test
                    </Button>
                </Space>
            </SectionCard>
        </div>
    );
}
