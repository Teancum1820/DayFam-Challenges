export const WORLDS = {
  jerusalem: { name:'Jerusalem', color:'#c1872c', depth:'#925e1b', bg:'#ffe8b5', image:'world-jerusalem' },
  desert: { name:'The wilderness', color:'#c77b35', depth:'#94511e', bg:'#ffedc9', image:'world-desert' },
  ocean: { name:'Across the sea', color:'#168cab', depth:'#09657f', bg:'#c7f4f7', image:'world-ocean' },
  jungle: { name:'The promised land', color:'#42934a', depth:'#28662f', bg:'#ddf0c2', image:'world-jungle' },
  highlands: { name:'Cities & hills', color:'#54897b', depth:'#32685c', bg:'#dfefdf', image:'world-highlands' },
  temple: { name:'The temple', color:'#3d9e91', depth:'#23776c', bg:'#dcf4eb', image:'world-temple' },
  destruction: { name:'Storm & destruction', color:'#78667f', depth:'#514258', bg:'#e6dfe8', image:'world-destruction' },
  desolation: { name:'The final records', color:'#657a92', depth:'#42566f', bg:'#e0e9f0', image:'world-desolation' },
  bountiful: { name:'Bountiful coast', color:'#bd9141', depth:'#826126', bg:'#ffe7ac', image:'world-bountiful' },
  forest: { name:'The forest', color:'#5e893c', depth:'#3d6024', bg:'#d5e5af', image:'world-forest' },
  waters: { name:'The Waters of Mormon', color:'#3eaaa5', depth:'#227d79', bg:'#c2efdf', image:'world-waters' },
  zarahemla: { name:'Zarahemla', color:'#c98c61', depth:'#8e5c3d', bg:'#ffe1ba', image:'world-zarahemla' },
  strongholds: { name:'Cities & strongholds', color:'#82964b', depth:'#57662e', bg:'#dde6b3', image:'world-strongholds' },
  mountain: { name:'The mountain', color:'#8586b7', depth:'#575987', bg:'#dedff2', image:'world-mountain' }
};

// Illustrated narrative settings, not a reconstruction of ancient geography.
export const REGIONS = {
  '1-ne': [[1,1,'jerusalem','Jerusalem'],[2,2,'desert','Into the wilderness'],[3,5,'jerusalem','Return for the records'],[6,16,'desert','Wilderness & visions'],[17,17,'bountiful','Bountiful coast'],[18,18,'ocean','Across the sea'],[19,22,'jungle','The promised land']],
  '2-ne': [[1,4,'jungle','A new home'],[5,24,'highlands','The land of Nephi'],[25,33,'temple','Rejoice in Christ']],
  jacob: [[1,4,'highlands','The people of Nephi'],[5,7,'forest','The Lord’s vineyard']],
  enos: [[1,1,'forest','A prayer in the forest']],
  jarom: [[1,1,'forest','Preserving the people']],
  omni: [[1,1,'zarahemla','Toward Zarahemla']],
  'w-of-m': [[1,1,'highlands','Gathering the records']],
  mosiah: [[1,6,'temple','King Benjamin’s people'],[7,17,'highlands','The land of Nephi'],[18,18,'waters','The Waters of Mormon'],[19,24,'forest','Deliverance in the wilderness'],[25,29,'zarahemla','Return to Zarahemla']],
  alma: [[1,16,'zarahemla','Zarahemla & the cities'],[17,23,'jungle','The sons of Mosiah'],[24,26,'forest','A covenant of peace'],[27,31,'zarahemla','Return & teach'],[32,35,'highlands','Faith & the word'],[36,42,'forest','A father’s counsel'],[43,63,'strongholds','Cities & strongholds']],
  hel: [[1,4,'zarahemla','The Nephite cities'],[5,5,'strongholds','Faith in the prison'],[6,12,'zarahemla','Remember the Lord'],[13,16,'temple','Samuel’s warning']],
  '3-ne': [[1,7,'jungle','Signs & a changing people'],[8,10,'destruction','Three days of darkness'],[11,30,'temple','Jesus Christ visits His people']],
  '4-ne': [[1,1,'temple','Unity, then division']],
  morm: [[1,9,'destruction','The end of a people']],
  ether: [[1,3,'mountain','The brother of Jared'],[4,6,'ocean','The Jaredite voyage'],[7,15,'desolation','Kings & the final record']],
  moro: [[1,10,'desolation','Moroni’s final witness']]
};

const milestone = (asset, title, description) => ({asset,title,description});
export const LANDMARKS = {
  '1-ne-1': milestone('book-of-mormon','Your Book of Mormon journey','Begin the record with Lehi’s witness in Jerusalem.'),
  '1-ne-2': milestone('lehi-tent','Lehi’s camp','Lehi’s family leaves Jerusalem and pitches a tent in the wilderness.'),
  '1-ne-4': milestone('brass-plates','The brass plates','Nephi obtains the brass plates and returns to his family.'),
  '1-ne-5': milestone('lehi-family','A joyful reunion','Lehi and Sariah rejoice when their sons return with the brass plates.'),
  '1-ne-7': milestone('nephi','Nephi’s faith','Nephi trusts the Lord as his family continues its journey.'),
  '1-ne-8': milestone('tree-of-life','The tree of life','Lehi sees the tree, its precious fruit, and the path that leads to it.'),
  '1-ne-11': milestone('tree-of-life','The meaning of the tree','Nephi learns about the love of God in his vision.'),
  '1-ne-15': milestone('iron-rod','Hold fast to the word','Nephi explains that the rod of iron represents the word of God.'),
  '1-ne-16': milestone('liahona','The Liahona','A curious ball guides the family through the wilderness as they exercise faith.'),
  '1-ne-17': milestone('nephi-ship','Build a ship','The Lord commands Nephi to build a ship in Bountiful.'),
  '1-ne-18': milestone('nephi-ship','Across the great waters','The family sets sail and reaches the promised land.'),
  '2-ne-5': milestone('nephi','A new home','Nephi’s people build, plant, keep records, and construct a temple.'),
  '2-ne-25': milestone('book-of-mormon','Rejoice in Christ','Nephi teaches his children to believe in Christ and look to Him for salvation.'),
  '2-ne-31': milestone('waters-of-mormon','The doctrine of Christ','Nephi teaches faith in Christ, repentance, baptism, and enduring to the end.'),
  'jacob-5': milestone('olive-tree','The olive trees','Jacob shares Zenos’s allegory of the olive trees and the Lord of the vineyard.'),
  'jacob-4': milestone('jacob-scroll','Jacob’s witness','Jacob writes to help future readers know Christ and remember the faith of their fathers.'),
  'enos-1': milestone('enos-praying','Enos’s prayer','Enos prays for forgiveness, his people, and the preservation of the records.'),
  'jarom-1': milestone('olive-tree','Preserve & prosper','Jarom records the Lord’s care for the people as they keep His commandments.'),
  'omni-1': milestone('gold-plates','Passing on the records','The small plates pass through generations as the people journey to Zarahemla.'),
  'w-of-m-1': milestone('gold-plates','Mormon gathers the records','Mormon explains why he includes the small plates with his record.'),
  'mosiah-2': milestone('benjamin-tower','King Benjamin’s tower','King Benjamin teaches the gathered people about serving God and one another.'),
  'mosiah-13': milestone('abinadi','Abinadi’s witness','Abinadi teaches God’s commandments and continues his message with courage.'),
  'mosiah-18': milestone('waters-of-mormon','The Waters of Mormon','Alma teaches the people and baptizes them at the Waters of Mormon.'),
  'mosiah-27': milestone('alma-conversion','Alma’s mighty change','An angel appears to Alma and the sons of Mosiah, beginning their change of heart.'),
  'alma-17': milestone('ammon','The sons of Mosiah','Ammon and his brothers begin their missions among the Lamanites.'),
  'alma-24': milestone('buried-weapons','A covenant of peace','The Anti-Nephi-Lehies bury their weapons as a witness of their covenant with God.'),
  'alma-32': milestone('faith-seed','A seed of faith','Alma invites the people to experiment on the word and nourish it like a seed.'),
  'alma-37': milestone('liahona','Guided by the word','Alma compares the Liahona’s guidance to the guidance we receive through Christ’s word.'),
  'alma-46': milestone('title-of-liberty','The title of liberty','Captain Moroni raises the title of liberty and calls the people to remember their covenants.'),
  'alma-53': milestone('stripling-warriors','The two thousand','The sons of the people of Ammon covenant to defend their families and choose Helaman as their leader.'),
  'alma-56': milestone('stripling-warriors','Courage & faith','Helaman describes the courage of the young soldiers and the faith their mothers taught them.'),
  'hel-5': milestone('prison-fire','A protecting fire','Nephi and Lehi are encircled by fire in prison and protected by the power of God.'),
  'hel-13': milestone('samuel-wall','Samuel on the wall','Samuel the Lamanite teaches from the wall of Zarahemla.'),
  '3-ne-8': milestone('world-destruction','Storm & destruction','Storms, earthquakes, and darkness change the land.'),
  '3-ne-11': milestone('christ-visit','The Savior appears','Jesus Christ appears to the people gathered at the temple in Bountiful.'),
  '3-ne-17': milestone('christ-children','Jesus blesses the children','The Savior heals the sick and blesses the children one by one.'),
  '4-ne-1': milestone('faith-seed','A people united','The people live in peace and unity before divisions return over time.'),
  'morm-8': milestone('moroni-keeper','Moroni keeps the record','Moroni continues his father Mormon’s record after the destruction of the Nephites.'),
  'morm-6': milestone('mormon-records','Preserving the records','Mormon hides the sacred records in Cumorah and gives a few plates to his son Moroni.'),
  'ether-2': milestone('jared-barge','Preparing the barges','The Lord directs the brother of Jared as his people prepare barges for their voyage.'),
  'ether-3': milestone('glowing-stones','Stones of light','The Lord touches the stones prepared by the brother of Jared.'),
  'ether-6': milestone('jared-barge','The Jaredite voyage','The Jaredites cross the sea in barges, guided and protected by the Lord.'),
  'ether-12': milestone('faith-seed','Faith & hope','Moroni teaches about faith, hope, and strength through Jesus Christ.'),
  'moro-1': milestone('moroni-keeper','The last record keeper','Moroni preserves teachings for future readers while he is alone.'),
  'moro-7': milestone('faith-seed','Faith, hope & charity','Moroni shares Mormon’s teachings about faith, hope, and the pure love of Christ.'),
  'moro-10': milestone('gold-plates','Moroni’s final invitation','Moroni invites us to ask God, receive a witness, and come unto Christ.')
};

export function regionAt(slug, chapter) {
  const entry = REGIONS[slug]?.find(([from,to]) => chapter >= from && chapter <= to);
  return entry ? { from:entry[0], to:entry[1], world:entry[2], title:entry[3], ...WORLDS[entry[2]] } : null;
}
export const storyAsset = name => 'assets/story/' + name + '.webp';
