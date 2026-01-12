import KidCard from "./KidCard";
import Button from "../general/Button";

export default function KidsList({ kids, calculateAge, lastKidDoc, loadMoreKids, loading }) {
  return (
    <div>
      <div className="px-4 py-2 flex flex-row flex-wrap gap-5 justify-center relative">
        {kids.map((kid) => (
          <KidCard
            kid={kid}
            calculateAge={calculateAge}
            key={kid?.id}
          />
        ))}
      </div>
      {lastKidDoc && (
        <div className="flex justify-center">
          <Button
            onClick={loadMoreKids}
            btnText={loading ? "Loading..." : "Load More"}
            color="bg-blue-500"
            textColor="text-white"
            font="font-bold"
            rounded="rounded-full"
            size="w-full px-4 py-2 rounded-full text-center text-xs"
          />
        </div>
      )}
    </div>
  );
}