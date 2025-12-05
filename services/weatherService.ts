import type { Weather, WeatherCondition } from '../types';

let currentConditionIndex = 0;
const conditions: WeatherCondition[] = ['Sunny', 'Windy', 'Rainy'];

const weatherData: { [key in WeatherCondition]: Omit<Weather, 'condition'> } = {
    Sunny: { temperature: 28, windSpeed: 5 },
    Windy: { temperature: 24, windSpeed: 25 },
    Rainy: { temperature: 22, windSpeed: 10 },
};

/**
 * Simulates fetching the current weather conditions.
 * Cycles through Sunny -> Windy -> Rainy on each call for demo purposes.
 * @returns {Promise<Weather>} A promise that resolves with the current weather.
 */
export const getWeather = async (): Promise<Weather> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const condition = conditions[currentConditionIndex];
            const data = {
                condition,
                ...weatherData[condition],
            };
            // Cycle to the next condition for the next call
            currentConditionIndex = (currentConditionIndex + 1) % conditions.length;
            resolve(data);
        }, 500); // Simulate network latency
    });
};