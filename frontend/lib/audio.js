export const splitText = (text, maxLength = 4095) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxLength;

    if (end >= text.length) {
      chunks.push(text.slice(start));
      break;
    }

    // search backwards from maximum length for sentence end
    let splitPoint = end;
    while (splitPoint > start) {
      if (".?!".includes(text[splitPoint])) {
        splitPoint++;
        break;
      }
      splitPoint--;
    }
    //if can't find a sentence end, just split at end
    if (splitPoint == start) {
      splitPoint = end;
    }

    chunks.push(text.slice(start, splitPoint));
    start = splitPoint;
  }

  return chunks;
};
