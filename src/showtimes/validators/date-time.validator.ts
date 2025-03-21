// src/showtimes/validators/date-time.validator.ts
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments
} from 'class-validator';

@ValidatorConstraint({ name: 'isEndTimeAfterStartTime', async: false })
export class IsEndTimeAfterStartTime implements ValidatorConstraintInterface {
    validate(endTimeStr: string, args: ValidationArguments) {
        const startTimeStr = (args.object as any)[args.constraints[0]];
        if (!startTimeStr || !endTimeStr) return false;

        try {
            const startTime = new Date(startTimeStr);
            const endTime = new Date(endTimeStr);

            return endTime > startTime;
        } catch (error) {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return 'End time must be after start time';
    }
}