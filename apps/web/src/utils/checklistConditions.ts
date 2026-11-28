export interface ItemCondition {
  parentClientId: string;
  operator: 'EQUALS' | 'NOT_EQUALS';
  expectedValue: string;
}

/**
 * Evaluates whether a checklist question should be visible based on its
 * parent question's answer (branching / step-by-step logic).
 */
export function isChecklistItemVisible(
  item: any,
  allItems: any[],
  getAnswer: (itemId: string) => any,
  scaleOptions: any[] = []
): boolean {
  const cond: ItemCondition | null | undefined = item?.config?.condition;
  if (!cond || !cond.parentClientId) return true;

  const parentItem = allItems.find((i) => i?.config?.clientId === cond.parentClientId);
  if (!parentItem) return true;

  const parentAns = getAnswer(parentItem.id);
  if (!parentAns) return false;

  let actualVal = '';
  if (parentAns.notApplicable) {
    actualVal = 'NA';
  } else if (parentItem.questionType === 'YES_NO') {
    if (parentAns.yesNoValue === true) actualVal = 'YES';
    else if (parentAns.yesNoValue === false) actualVal = 'NO';
    else return false;
  } else if (parentItem.questionType === 'SCALE') {
    const opt = scaleOptions.find((o) => o.id === parentAns.scaleOptionId);
    if (!opt) return false;
    actualVal = opt.label;
  } else if (parentItem.questionType === 'NUMBER') {
    if (parentAns.numberValue === null || parentAns.numberValue === undefined || parentAns.numberValue === '') {
      return false;
    }
    actualVal = String(parentAns.numberValue);
  } else {
    if (!parentAns.textValue) return false;
    actualVal = String(parentAns.textValue);
  }

  const expected = String(cond.expectedValue || '').trim();
  const isMatch = actualVal.toLowerCase() === expected.toLowerCase();
  return cond.operator === 'NOT_EQUALS' ? !isMatch : isMatch;
}
