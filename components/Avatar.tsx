/** @jsx h */
import { h } from "preact";

import { toSvg } from "https://cdn.skypack.dev/jdenticon";

export function Avatar(props: h.JSX.HTMLAttributes<HTMLButtonElement>) {
  // Simply get a random avatar

  // Optionally specify a seed for the avatar. e.g. for always getting the same avatar for a user id.
  // With seed 'avatar', always returns https://avataaars.io/?accessoriesType=Kurt&avatarStyle=Circle&clotheColor=Blue01&clotheType=Hoodie&eyeType=EyeRoll&eyebrowType=RaisedExcitedNatural&facialHairColor=Blonde&facialHairType=BeardMagestic&hairColor=Black&hatColor=White&mouthType=Sad&skinColor=Yellow&topType=ShortHairShortWaved
  const content = toSvg(props.address, props.size);

  return <span dangerouslySetInnerHTML={{ __html: content }}></span>;
}
