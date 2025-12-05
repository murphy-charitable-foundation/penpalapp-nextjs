"use client";

import Button from "../general/Button";
import { useDeadletter } from "../../context/DeadletterContext";

const DeadletterButton = () => {
  const { isDeadletterLoading, handleDeadletterWorker } = useDeadletter();

  return (
    <Button
      disabled={isDeadletterLoading}
      btnText="Send Deadletter"
      color="green"
      textColor="text-white"
      rounded="rounded-md"
      onClick={handleDeadletterWorker}
    />
  );
};

export default DeadletterButton;
