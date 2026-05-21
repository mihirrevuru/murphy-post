interface GreetingProps {
  username: string;
  spiralCount: number;
}

export default function Greeting({ username, spiralCount }: GreetingProps) {
  return (
    <div className="border-b border-[#1A1A1A]/20 py-2 px-4 bg-[#F5E6C8]/40">
      <p className="font-inter italic text-sm text-[#1A1A1A]/60 text-center">
        Welcome back, {username}. Murphy is watching.
        {spiralCount > 0 && (
          <span className="font-mono text-xs ml-2 not-italic">
            [{spiralCount} spiral{spiralCount !== 1 ? "s" : ""} filed today]
          </span>
        )}
      </p>
    </div>
  );
}
