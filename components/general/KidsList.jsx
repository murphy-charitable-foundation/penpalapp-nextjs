import KidCard from "../general/KidCard";

export default function KidsList({ kids, calculateAge, lastKidDoc, loadMoreKids, loading }) {
  return (
    <div>
      <div className="px-4 py-2 flex flex-row flex-wrap gap-5 justify-center relative">
        {kids.map((kid) => (
          <KidCard
            kid={kid}
            calculateAge={calculateAge}
            key={kid?.id}
            style={{ minHeight: "300px", minWidth: "280px" }}
          />
        ))}
      </div>
      {lastKidDoc && (
        <div className="flex justify-center">
          <button
            onClick={loadMoreKids}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}