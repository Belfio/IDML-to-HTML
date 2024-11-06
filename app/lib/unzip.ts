import unzipper from "unzipper";

export default async function unzip(pathIn: string, pathOut: string) {
  const directory = await await unzipper.Open.file(pathIn);

  await directory.extract({ path: pathOut });
  console.log("unziped", pathOut);
}
