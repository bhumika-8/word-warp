import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

export function generateUniqueName(existingNames) {
  let name;
  do {
    name = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: ' ',
      style: 'capital',
    });
  } while (Object.values(existingNames).includes(name)); 
  return name;
}
