import animals from "./animals.json";
import adjectives from "./adjectives.json";

export const generateRandomAnimal = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective} ${animal}`;
};
