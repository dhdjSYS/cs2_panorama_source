/// <reference path="../csgo.d.ts" />
var CFormattedText = class {
    tag;
    vars;
    constructor(strLocTag, mapDialogVars) {
        this.tag = strLocTag;
        this.vars = Object.assign({}, mapDialogVars);
    }
    SetOnLabel(elLabel) {
        FormatText.SetFormattedTextOnLabel(elLabel, this);
    }
};
var FormatText = (function () {
    const _SetFormattedTextOnLabel = function (elLabel, fmtText) {
        _ClearFormattedTextFromLabel(elLabel);
        elLabel.text = fmtText.tag;
        elLabel.fmtTextVars = {};
        for (const varName in fmtText.vars) {
            elLabel.SetDialogVariable(varName, elLabel.html ? $.HTMLEscape(fmtText.vars[varName]) : fmtText.vars[varName]);
            elLabel.fmtTextVars[varName] = true;
        }
    };
    const _ClearFormattedTextFromLabel = function (elLabel) {
        elLabel.text = '';
        if (!elLabel.fmtTextVars)
            return;
        for (const varName in elLabel.fmtTextVars) {
            elLabel.SetDialogVariable(varName, '');
        }
        delete elLabel.fmtTextVars;
    };
    const _SecondsToDDHHMMSSWithSymbolSeperator = function (rawSeconds) {
        const time = _ConvertSecondsToDaysHoursMinSec(rawSeconds);
        const timeText = [];
        let returnRemaining = false;
        for (const key in time) {
            const value = time[key];
            if ((value > 0 && !returnRemaining) || key == 'minutes')
                returnRemaining = true;
            if (returnRemaining) {
                const valueToShow = (value < 10) ? ('0' + value.toString()) : value.toString();
                timeText.push(valueToShow);
            }
        }
        return timeText.join(':');
    };
    const _SecondsToSignificantTimeString = function (rawSeconds) {
        if (rawSeconds < 60)
            return '1 ' + $.Localize('#SFUI_Store_Timer_Min');
        const time = _ConvertSecondsToDaysHoursMinSec(rawSeconds);
        let numComponentsReturned = 0;
        let strResult = '';
        for (const key in time) {
            const value = time[key];
            if (key == 'seconds')
                break;
            let bAppendThisComponent = false;
            const bFinishedAfterThisComponent = (numComponentsReturned > 0);
            if (value > 0) {
                bAppendThisComponent = true;
            }
            if (bAppendThisComponent) {
                if (bFinishedAfterThisComponent)
                    strResult += ' ';
                let lockey;
                if (key == 'minutes')
                    lockey = '#SFUI_Store_Timer_Min';
                else if (key == 'hours')
                    lockey = '#SFUI_Store_Timer_Hour';
                else
                    lockey = '#SFUI_Store_Timer_Day';
                strResult += value.toString();
                strResult += ' ';
                strResult += $.Localize(lockey + ((value > 1) ? 's' : ''));
                ++numComponentsReturned;
            }
            if (bFinishedAfterThisComponent)
                break;
        }
        return strResult;
    };
    const _ConvertSecondsToDaysHoursMinSec = function (rawSeconds) {
        rawSeconds = Number(rawSeconds);
        const time = {
            days: Math.floor(rawSeconds / 86400),
            hours: Math.floor((rawSeconds % 86400) / 3600),
            minutes: Math.floor(((rawSeconds % 86400) % 3600) / 60),
            seconds: ((rawSeconds % 86400) % 3600) % 60
        };
        return time;
    };
    const _PadNumber = function (integer, digits, char = '0') {
        integer = integer.toString();
        while (integer.length < digits)
            integer = char + integer;
        return integer;
    };
    const _SplitAbbreviateNumber = function (number, fixed = 0) {
        if (number < 0)
            return -1;
        let pow10 = Math.log10(number) | 0;
        let stringToken = "";
        const locFilePrefix = "#NumberAbbreviation_suffix_E";
        do {
            stringToken = locFilePrefix + [pow10];
            if ($.Localize(stringToken) != stringToken)
                break;
        } while (--pow10 > 0);
        if ($.Localize(stringToken) == stringToken)
            return [number.toString(), ''];
        const scale = Math.pow(10, pow10);
        const scaledNumber = number / scale;
        const decimals = scaledNumber < 10.0 ? 1 : 0;
        const finalNum = scaledNumber.toFixed(fixed).replace(/\.0+$/, '');
        return [finalNum, $.Localize(stringToken)];
    };
    const _AbbreviateNumber = function (number) {
        if (number < 0)
            return -1;
        let pow10 = Math.log10(number) | 0;
        let stringToken = "";
        const locFilePrefix = "#NumberAbbreviation_E";
        function _IsLocalizationValid(symbol) {
            return (symbol === "");
        }
        do {
            stringToken = locFilePrefix + [pow10];
            if (_IsLocalizationValid($.Localize(stringToken, $.GetContextPanel())))
                break;
        } while (--pow10 > 0);
        if (!_IsLocalizationValid($.Localize(stringToken, $.GetContextPanel())))
            return number.toString();
        const scale = Math.pow(10, pow10);
        const scaledNumber = number / scale;
        const decimals = scaledNumber < 10.0 ? 1 : 0;
        const finalNum = scaledNumber.toFixed(decimals).replace(/\.0+$/, '');
        $.GetContextPanel().SetDialogVariable('abbreviated_number', finalNum);
        const result = $.Localize(stringToken, $.GetContextPanel());
        return result;
    };
    function _CapitalizeFirstLetterOfEachWord(sentence) {
        return sentence.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
    function _ForceSign(num) {
        if (Number(num) >= 0)
            return '+' + num;
        else
            return String(num);
    }
    return {
        SetFormattedTextOnLabel: _SetFormattedTextOnLabel,
        ClearFormattedTextFromLabel: _ClearFormattedTextFromLabel,
        SecondsToDDHHMMSSWithSymbolSeperator: _SecondsToDDHHMMSSWithSymbolSeperator,
        SecondsToSignificantTimeString: _SecondsToSignificantTimeString,
        PadNumber: _PadNumber,
        AbbreviateNumber: _AbbreviateNumber,
        SplitAbbreviateNumber: _SplitAbbreviateNumber,
        CapitalizeFirstLetterOfEachWord: _CapitalizeFirstLetterOfEachWord,
        ForceSign: _ForceSign,
    };
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZvcm1hdHRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUNBQXFDO0FBcUJyQyxJQUFJLGNBQWMsR0FBRztJQUVwQixHQUFHLENBQVM7SUFDWixJQUFJLENBQXFCO0lBRXpCLFlBQWEsU0FBaUIsRUFBRSxhQUFpQztRQUVoRSxJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQztRQUdyQixJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBRSxDQUFDO0lBQ2hELENBQUM7SUFFRCxVQUFVLENBQUcsT0FBZ0I7UUFFNUIsVUFBVSxDQUFDLHVCQUF1QixDQUFFLE9BQU8sRUFBRSxJQUFJLENBQUUsQ0FBQztJQUNyRCxDQUFDO0NBQ0QsQ0FBQztBQUVGLElBQUksVUFBVSxHQUFHLENBQUU7SUFFbEIsTUFBTSx3QkFBd0IsR0FBRyxVQUFXLE9BQXVCLEVBQUUsT0FBbUQ7UUFFdkgsNEJBQTRCLENBQUUsT0FBTyxDQUFFLENBQUM7UUFFeEMsT0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQzNCLE9BQU8sQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLEtBQU0sTUFBTSxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksRUFDbkM7WUFDQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUUsT0FBTyxDQUFDLElBQUksQ0FBRSxPQUFPLENBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFFLE9BQU8sQ0FBRyxDQUFFLENBQUM7WUFDeEgsT0FBTyxDQUFDLFdBQVcsQ0FBRSxPQUFPLENBQUUsR0FBRyxJQUFJLENBQUM7U0FDdEM7SUFDRixDQUFDLENBQUM7SUFFRixNQUFNLDRCQUE0QixHQUFHLFVBQVcsT0FBdUI7UUFFdEUsT0FBTyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFFbEIsSUFBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ3hCLE9BQU87UUFFUixLQUFNLE1BQU0sT0FBTyxJQUFJLE9BQU8sQ0FBQyxXQUFXLEVBQzFDO1lBRUMsT0FBTyxDQUFDLGlCQUFpQixDQUFFLE9BQU8sRUFBRSxFQUFFLENBQUUsQ0FBQztTQUN6QztRQUdELE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQztJQUM1QixDQUFDLENBQUM7SUFJRixNQUFNLHFDQUFxQyxHQUFHLFVBQVcsVUFBMkI7UUFFbkYsTUFBTSxJQUFJLEdBQUcsZ0NBQWdDLENBQUUsVUFBVSxDQUFFLENBQUM7UUFDNUQsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1FBRTlCLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztRQUM1QixLQUFNLE1BQU0sR0FBRyxJQUFJLElBQUksRUFDdkI7WUFDQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUUsR0FBd0IsQ0FBRSxDQUFDO1lBSS9DLElBQUssQ0FBRSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFFLElBQUksR0FBRyxJQUFJLFNBQVM7Z0JBQ3pELGVBQWUsR0FBRyxJQUFJLENBQUM7WUFFeEIsSUFBSyxlQUFlLEVBQ3BCO2dCQUNDLE1BQU0sV0FBVyxHQUFHLENBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNuRixRQUFRLENBQUMsSUFBSSxDQUFFLFdBQVcsQ0FBRSxDQUFDO2FBQzdCO1NBQ0Q7UUFFRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUUsR0FBRyxDQUFFLENBQUM7SUFDN0IsQ0FBQyxDQUFDO0lBRUYsTUFBTSwrQkFBK0IsR0FBRyxVQUFXLFVBQTJCO1FBRTdFLElBQUssVUFBVSxHQUFHLEVBQUU7WUFDbkIsT0FBTyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO1FBRXJELE1BQU0sSUFBSSxHQUFHLGdDQUFnQyxDQUFFLFVBQVUsQ0FBRSxDQUFDO1FBQzVELElBQUkscUJBQXFCLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNuQixLQUFNLE1BQU0sR0FBRyxJQUFJLElBQUksRUFDdkI7WUFDQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUUsR0FBZ0IsQ0FBRSxDQUFDO1lBRXZDLElBQUssR0FBRyxJQUFJLFNBQVM7Z0JBQ3BCLE1BQU07WUFFUCxJQUFJLG9CQUFvQixHQUFHLEtBQUssQ0FBQztZQUNqQyxNQUFNLDJCQUEyQixHQUFHLENBQUUscUJBQXFCLEdBQUcsQ0FBQyxDQUFFLENBQUM7WUFDbEUsSUFBSyxLQUFLLEdBQUcsQ0FBQyxFQUNkO2dCQUNDLG9CQUFvQixHQUFHLElBQUksQ0FBQzthQUM1QjtZQUNELElBQUssb0JBQW9CLEVBQ3pCO2dCQUNDLElBQUssMkJBQTJCO29CQUMvQixTQUFTLElBQUksR0FBRyxDQUFDO2dCQUVsQixJQUFJLE1BQU0sQ0FBQztnQkFDWCxJQUFLLEdBQUcsSUFBSSxTQUFTO29CQUNwQixNQUFNLEdBQUcsdUJBQXVCLENBQUM7cUJBQzdCLElBQUssR0FBRyxJQUFJLE9BQU87b0JBQ3ZCLE1BQU0sR0FBRyx3QkFBd0IsQ0FBQzs7b0JBRWxDLE1BQU0sR0FBRyx1QkFBdUIsQ0FBQztnQkFFbEMsU0FBUyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDOUIsU0FBUyxJQUFJLEdBQUcsQ0FBQztnQkFFakIsU0FBUyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUUsTUFBTSxHQUFHLENBQUUsQ0FBRSxLQUFLLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLENBQUUsQ0FBQztnQkFFakUsRUFBRSxxQkFBcUIsQ0FBQzthQUN4QjtZQUNELElBQUssMkJBQTJCO2dCQUMvQixNQUFNO1NBQ1A7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDLENBQUM7SUFHRixNQUFNLGdDQUFnQyxHQUFHLFVBQVcsVUFBMkI7UUFFOUUsVUFBVSxHQUFHLE1BQU0sQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUVsQyxNQUFNLElBQUksR0FBRztZQUNaLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFFLFVBQVUsR0FBRyxLQUFLLENBQUU7WUFDdEMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBRSxVQUFVLEdBQUcsS0FBSyxDQUFFLEdBQUcsSUFBSSxDQUFFO1lBQ2xELE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUUsQ0FBRSxVQUFVLEdBQUcsS0FBSyxDQUFFLEdBQUcsSUFBSSxDQUFFLEdBQUcsRUFBRSxDQUFFO1lBQzdELE9BQU8sRUFBRSxDQUFFLENBQUUsVUFBVSxHQUFHLEtBQUssQ0FBRSxHQUFHLElBQUksQ0FBRSxHQUFHLEVBQUU7U0FDL0MsQ0FBQztRQUVGLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDO0lBR0YsTUFBTSxVQUFVLEdBQUcsVUFBVyxPQUF3QixFQUFFLE1BQWMsRUFBRSxPQUFlLEdBQUc7UUFFekYsT0FBTyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUU3QixPQUFRLE9BQU8sQ0FBQyxNQUFNLEdBQUcsTUFBTTtZQUM5QixPQUFPLEdBQUcsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUUxQixPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDLENBQUM7SUFHRixNQUFNLHNCQUFzQixHQUFHLFVBQVcsTUFBYyxFQUFFLFFBQWdCLENBQUM7UUFHMUUsSUFBSyxNQUFNLEdBQUcsQ0FBQztZQUNkLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFWCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQztRQUVyQyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFFckIsTUFBTSxhQUFhLEdBQUcsOEJBQThCLENBQUM7UUFDckQsR0FDQTtZQUNDLFdBQVcsR0FBRyxhQUFhLEdBQUcsQ0FBRSxLQUFLLENBQUUsQ0FBQztZQUd4QyxJQUFLLENBQUMsQ0FBQyxRQUFRLENBQUUsV0FBVyxDQUFFLElBQUksV0FBVztnQkFDNUMsTUFBTTtTQUVQLFFBQVMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFHO1FBRXhCLElBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBRSxXQUFXLENBQUUsSUFBSSxXQUFXO1lBQzVDLE9BQU8sQ0FBRSxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFbEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxFQUFFLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFHcEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUdwQyxNQUFNLFFBQVEsR0FBRyxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUc3QyxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBRSxDQUFDLE9BQU8sQ0FBRSxPQUFPLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFdEUsT0FBTyxDQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLFdBQVcsQ0FBRSxDQUFFLENBQUM7SUFDaEQsQ0FBQyxDQUFDO0lBS0YsTUFBTSxpQkFBaUIsR0FBRyxVQUFXLE1BQWM7UUFHbEQsSUFBSyxNQUFNLEdBQUcsQ0FBQztZQUNkLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFWCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQztRQUVyQyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFFckIsTUFBTSxhQUFhLEdBQUcsdUJBQXVCLENBQUM7UUFFOUMsU0FBUyxvQkFBb0IsQ0FBRyxNQUFjO1lBRzdDLE9BQU8sQ0FBRSxNQUFNLEtBQUssRUFBRSxDQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVELEdBQ0E7WUFDQyxXQUFXLEdBQUcsYUFBYSxHQUFHLENBQUUsS0FBSyxDQUFFLENBQUM7WUFHeEMsSUFBSyxvQkFBb0IsQ0FBRSxDQUFDLENBQUMsUUFBUSxDQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUUsQ0FBRTtnQkFDMUUsTUFBTTtTQUVQLFFBQVMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFHO1FBRXhCLElBQUssQ0FBQyxvQkFBb0IsQ0FBRSxDQUFDLENBQUMsUUFBUSxDQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUUsQ0FBRTtZQUMzRSxPQUFPLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUUxQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLEVBQUUsRUFBRSxLQUFLLENBQUUsQ0FBQztRQUdwQyxNQUFNLFlBQVksR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBR3BDLE1BQU0sUUFBUSxHQUFHLFlBQVksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRzdDLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUUsUUFBUSxDQUFFLENBQUMsT0FBTyxDQUFFLE9BQU8sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUV6RSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsb0JBQW9CLEVBQUUsUUFBUSxDQUFFLENBQUM7UUFFeEUsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFFLENBQUM7UUFJOUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDLENBQUM7SUFHRixTQUFTLGdDQUFnQyxDQUFHLFFBQWdCO1FBRTNELE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBRSxRQUFRLEVBQUUsVUFBVyxHQUFHO1lBRWhELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQyxXQUFXLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3RFLENBQUMsQ0FBRSxDQUFDO0lBQ0wsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFHLEdBQW9CO1FBRXpDLElBQUssTUFBTSxDQUFFLEdBQUcsQ0FBRSxJQUFJLENBQUM7WUFDdEIsT0FBTyxHQUFHLEdBQUcsR0FBRyxDQUFDOztZQUVqQixPQUFPLE1BQU0sQ0FBRSxHQUFHLENBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQsT0FBTztRQUNOLHVCQUF1QixFQUFFLHdCQUF3QjtRQUNqRCwyQkFBMkIsRUFBRSw0QkFBNEI7UUFDekQsb0NBQW9DLEVBQUUscUNBQXFDO1FBQzNFLDhCQUE4QixFQUFFLCtCQUErQjtRQUMvRCxTQUFTLEVBQUUsVUFBVTtRQUNyQixnQkFBZ0IsRUFBRSxpQkFBaUI7UUFDbkMscUJBQXFCLEVBQUUsc0JBQXNCO1FBQzdDLCtCQUErQixFQUFFLGdDQUFnQztRQUNqRSxTQUFTLEVBQUUsVUFBVTtLQUNyQixDQUFDO0FBQ0gsQ0FBQyxDQUFFLEVBQUUsQ0FBQyJ9