import Link from "next/link";
import Container from "@/components/Container";
import DogDetailsForm from "@/components/DogDetails/DogDetailsForm";

export default function DogDetailsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-5">
      <Container>
        <div className="flex flex-col items-center">


          <div className="w-full max-w-2xl text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              How Much Food Should My Dog Eat?
            </h1>
            <p className="text-foreground-accent text-base">
              Enter your dog&apos;s details to get daily calories!
            </p>
          </div>

          <DogDetailsForm />
        </div>
      </Container>
    </div>
  );
}
