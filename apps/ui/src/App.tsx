import { useState } from "react";
import "./App.css";
import { Button } from "@/components/ui/button";

function App() {
  const [count, setCount] = useState(0);

  const testApi = async () => {
    const response = await fetch("/api/config");
    const data = await response.json();
    console.log(data);
  };

  return (
    <>
      <Button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </Button>
      <Button onClick={testApi}>test api</Button>
    </>
  );
}

export default App;
