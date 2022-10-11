import { groupBy, mergeWith, isString } from 'lodash';
import { utc } from 'moment';

export const enum ResponseLabel {
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS',
  YEARS = 'YEARS',
}

interface Group {
  start: string;
  end: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface FormattedResponse {
  label?: ResponseLabel;
  groups?: Group[];
  start?: string;
  end?: string;
}

const sortDates = (dates: string[]): string[] => {
  return dates.sort(
    (a, b) => parseInt(utc(a).format('YYYYMMDD'), 10) - parseInt(utc(b).format('YYYYMMDD'), 10),
  );
};

function prepareResponseGroups(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  groupedData: Record<string, string[]>,
): Group[] {
  const groups: Group[] = [];
  const keys = Object.keys(groupedData);

  keys.forEach((key) => {
    const values = sortDates(groupedData[key]);

    const start = utc(values[0]).startOf('day').toISOString();
    const end = utc(values[values.length - 1])
      .endOf('day')
      .toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let groupData: any = null;

    (values || []).forEach((date) => {
      const element = data[date];

      if (typeof element === 'number') {
        groupData = (groupData || 0) + element;
      } else if (typeof element === 'object') {
        groupData = mergeWith({}, groupData, element, function (objValue, srcValue) {
          if (!isString(srcValue)) {
            return srcValue + (objValue || 0);
          } else {
            return srcValue;
          }
        });
      }
    });

    groups.push({
      start,
      end,
      data: groupData,
    });
  });

  return groups;
}

export const formatResponse = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  labelWanted?: ResponseLabel,
): FormattedResponse => {
  const dates = sortDates(Object.keys(data));

  if (!dates || dates.length === 0) {
    return {};
  }

  const start = utc(dates[0]);
  const end = utc(dates[dates.length - 1]);

  const diffInWeeks = end.isoWeek() - start.isoWeek(); // diff in weeks
  const diffInMonth = end.month() - start.month(); // diff in month
  const diffInYear = end.isoWeekYear() - start.isoWeekYear(); // diff in year

  let groupedData: Record<string, string[]> | null = null;
  let label: ResponseLabel | null = null;

  if (!labelWanted) {
    if (diffInYear > 0) {
      label = ResponseLabel.YEARS;
      groupedData = groupBy(Object.keys(data), (dt) => utc(dt).isoWeekYear());
    } else if (diffInWeeks === 0) {
      label = ResponseLabel.DAYS;
      groupedData = groupBy(Object.keys(data), (dt) => utc(dt).isoWeekday());
    } else if (diffInMonth <= 1) {
      label = ResponseLabel.WEEKS;
      groupedData = groupBy(Object.keys(data), (dt) => utc(dt).isoWeek());
    } else {
      label = ResponseLabel.MONTHS;
      groupedData = groupBy(Object.keys(data), (dt) => utc(dt).month());
    }
  } else {
    label = labelWanted;

    switch (label) {
      case ResponseLabel.YEARS:
        groupedData = groupBy(Object.keys(data), (dt) => utc(dt).isoWeekYear());
        break;

      case ResponseLabel.MONTHS:
        groupedData = groupBy(Object.keys(data), (dt) => utc(dt).month());
        break;

      case ResponseLabel.WEEKS:
        groupedData = groupBy(Object.keys(data), (dt) => utc(dt).isoWeek());
        break;

      default:
        groupedData = groupBy(Object.keys(data), (dt) => utc(dt).isoWeekday());
        break;
    }
  }

  const groups = prepareResponseGroups(data, groupedData);

  return {
    label,
    groups,
    start: start.toISOString(),
    end: end.endOf('day').toISOString(),
  };
};
