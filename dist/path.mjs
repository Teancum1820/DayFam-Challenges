// One connection for every adjacent chapter, independent of scenery boundaries.
export function chapterConnections(points, width) {
  return points.slice(0, -1).map((from, i) => {
    const to = points[i + 1];
    const middle = (from.y + to.y) / 2;
    const bookBreak = from.book !== to.book;
    let d = `M ${from.x} ${from.y} C ${from.x} ${middle}, ${to.x} ${middle}, ${to.x} ${to.y}`;
    if (bookBreak) {
      // Follow the outer margin around book headings rather than crossing their text.
      const gutter = width - 10, exit = from.exitY, entry = to.entryY;
      d = `M ${from.x} ${from.y} C ${from.x} ${exit - 34}, ${gutter} ${exit - 34}, ${gutter} ${exit} L ${gutter} ${entry} C ${gutter} ${entry + 34}, ${to.x} ${entry + 34}, ${to.x} ${to.y}`;
    }
    const pages = [];
    for (let page = from.startPage + 1; page < to.startPage; page++) pages.push(page);
    return { from, to, d, pages, bookBreak };
  });
}
