import { useState, useEffect } from "react";

export function useNpmVersion(pkgName: string = "termchat-cli") {
  const [version, setVersion] = useState<string>("v1.6.3");

  useEffect(() => {
    // Use jsDelivr to avoid CORS issues on registry.npmjs.org
    fetch(`https://cdn.jsdelivr.net/npm/${pkgName}/package.json`)
      .then((res) => res.json())
      .then((data) => {
        if (data.version) setVersion(`v${data.version}`);
      })
      .catch(() => {}); // Keep default on error
  }, [pkgName]);

  return version;
}
