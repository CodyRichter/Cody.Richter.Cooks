/**
 * Converts a decimal number to a fractional representation and returns it as a string.
 * @param decimal Decimal number to convert to a fraction
 * @returns
 */
export function convertToFractionalRepresentation(candidate: number): string {
  const maxDenominator = 10; // Maximum denominator to use for the fraction

  // If the candidate is greater than 1, we remove the integer part and only keep the decimal part.
  // We will add the integer part back to the fraction later.

  const prefix = Math.floor(candidate);
  const decimal = candidate - Math.floor(candidate);

  // If there is no decimal part, return the integer part as a string
  if (decimal === 0) {
    return prefix.toString();
  }

  let closestDifference = Infinity;
  let closestNumerator = 0;
  let closestDenominator = 1;
  for (let denominator = 1; denominator <= maxDenominator; denominator++) {
    const numerator = Math.round(decimal * denominator);
    const fraction = numerator / denominator;
    const difference = Math.abs(decimal - fraction);

    if (difference < closestDifference) {
      closestDifference = difference;
      closestNumerator = numerator;
      closestDenominator = denominator;
    }
  }

  // Reconstruct the fraction string and add the prefix if necessary
  let fractionString = `${closestNumerator}/${closestDenominator}`;

  if (closestNumerator === 0 && closestDenominator === 1 && prefix > 0) {
    // If the closest fraction is 0/1, we return only the prefix
    // This means that the decimal part was very small and rounded to 0
    return prefix.toString();
  } else if (closestNumerator === 0 && closestDenominator === 1) {
    // If the closest fraction is 0/1 and there is no prefix, return "0"
    return "Barely any";
  }

  return prefix === 0 ? fractionString : `${prefix} and ${fractionString}`;
}

/**
 * Converts a string to title case.
 * @param str The string to convert to title case
 * @returns The title-cased string
 */
export function titleize(str: string): string {
  return str
    .toLowerCase()
    .replaceAll(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
