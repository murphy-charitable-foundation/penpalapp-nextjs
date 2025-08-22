"use client";
// page.js


import Image from "next/image";
import logo from "/public/murphylogo.png";
import Link from "next/link";
import Button from "../components/general/Button";
import {PageBackground}from "../components/general/PageBackground";
import {PageContainer} from "../components/general/PageContainer";
import {PageHeader} from "../components/general/PageHeader";

export default function Home() {
  return (
    <PageBackground>
      <PageContainer maxWidth="md" padding="p-8">
        <PageHeader title="Welcome" />
        <div>

                  <div className="text-center">
                      <h1 className="font-bold text-2xl text-black py-1">
                          Welcome to Pen Pal App
                      </h1>
                      <p className="font-semibold text-lg text-black max-w-[260px] m-auto">
                          Write, connect, and inspire children in Uganda
                      </p>
                  </div>
              </div>

              <div className="flex flex-col gap-5 items-center mb-11">
                  <Link href="/login">
                      <Button
                          color={"green"}
                          btnText={"Log in"}
                      />
                  </Link>
                  <Link href="https://calendly.com/murphycharity/60min">
                      <Button
                          color={"blue"}
                          btnText={"Become a Pen Pal Volunteer"}
                      />
                  </Link>
              </div>
        
      </PageContainer>
    </PageBackground>
  );
}