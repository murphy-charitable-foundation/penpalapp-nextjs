"use client";

import React, { useEffect, useMemo, useState } from "react";
import KidsList from "../../components/discovery/KidsList";
import { db } from "../../firebase/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import PageBackground from "../../components/general/PageBackground";
import PageContainer from "../../components/general/PageContainer";
import PageHeader from "../../components/general/PageHeader";
import NavBar from "../../components/bottom-nav-bar";
import { usePageAnalytics } from "../useAnalytics";

function calculateAge(dob) {
  if (!dob) return null;

  let d = null;

  if (typeof dob === "object" && dob?.toDate) {
    d = dob.toDate();
  } else if (dob instanceof Date) {
    d = dob;
  } else {
    const parsed = new Date(dob);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }

  if (!d) return null;

  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function DiscoveryPage() {
  usePageAnalytics("/discovery");

  const PAGE_SIZE = 10;

  const [kids, setKids] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  const canLoadMore = useMemo(() => Boolean(lastDoc), [lastDoc]);

  const baseQuery = useMemo(() => {
    return query(
      collection(db, "kids"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );
  }, []);

  const fetchKids = async (qRef) => {
    const snap = await getDocs(qRef);
    const docs = snap.docs;

    const newKids = docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setKids(newKids);
    setLastDoc(docs.length ? docs[docs.length - 1] : null);
  };

  const loadInitial = async () => {
    setLoading(true);
    try {
      await fetchKids(baseQuery);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreKids = async () => {
    if (!lastDoc) return;
    setLoading(true);
    try {
      const nextQ = query(
        collection(db, "kids"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(nextQ);
      const docs = snap.docs;

      const moreKids = docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setKids((prev) => [...prev, ...moreKids]);
      setLastDoc(docs.length ? docs[docs.length - 1] : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[92dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <PageHeader title="Discovery" image={false} showBackButton />

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
            <KidsList
              kids={kids}
              calculateAge={calculateAge}
              lastKidDoc={canLoadMore ? lastDoc : null}
              loadMoreKids={loadMoreKids}
              loading={loading}
            />
          </div>

          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}