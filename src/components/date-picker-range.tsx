"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value?: { start?: Date; end?: Date };
  onChange: (range: { start?: Date; end?: Date }) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disabled?: boolean; // Add this line
}

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

const getStartOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

export const DateRangePicker = ({
  value,
  onChange,
  placeholder = "Chọn khoảng ngày",
  minDate,
  maxDate,
  className,
  disabled = false // Add this line with default value
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(value?.start ? getStartOfDay(value.start) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(value?.end ? getStartOfDay(value.end) : undefined);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const getInitialMonth = useCallback(() => { // Dùng useCallback để tránh tạo lại hàm không cần thiết
    const today = new Date();
    const initialDate = value?.start || (minDate && minDate > today ? minDate : today);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  }, [value?.start, minDate]); // Dependencies for useCallback

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  const [dropPosition, setDropPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // *** STATE MỚI: Theo dõi chế độ xem (day | month | year) ***
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');
  // State để lưu năm đang được xem trong chế độ chọn tháng/năm
  const [viewingYear, setViewingYear] = useState(currentMonth.getFullYear());

  // Reset view mode and viewing year when closing or opening
  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(getInitialMonth()); // Reset displayed month based on props/minDate
      setViewingYear(getInitialMonth().getFullYear()); // Reset viewing year as well
      setViewMode('day'); // Always start in day view
    } else {
        setViewMode('day'); // Reset view when closing
    }
  }, [isOpen, getInitialMonth]);

  // Update internal state if the value prop changes externally
  useEffect(() => {
    const newStartDate = value?.start ? getStartOfDay(value.start) : undefined;
    const newEndDate = value?.end ? getStartOfDay(value.end) : undefined;
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    // If not open, update the initial month based on new value
    if (!isOpen) {
        setCurrentMonth(getInitialMonth());
        setViewingYear(getInitialMonth().getFullYear());
    }
  }, [value?.start, value?.end, isOpen, getInitialMonth]);


  const formatDate = (date: Date): string => {
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  const isDateInRange = useCallback((date: Date): boolean => {
    const dateStart = getStartOfDay(date);
    if (minDate) {
      const minDateStart = getStartOfDay(minDate);
      if (dateStart < minDateStart) return false;
    }
    if (maxDate) {
      const maxDateStart = getStartOfDay(maxDate);
      if (dateStart > maxDateStart) return false;
    }
    return true;
  }, [minDate, maxDate]);

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const currentGridSize = days.length;
    const requiredCells = Math.ceil(currentGridSize / 7) * 7; // Adjust grid size dynamically (e.g., 35 or 42)
    for (let i = 1; i <= requiredCells - currentGridSize; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  // --- Navigation ---
  const isPrevMonthDisabled = useCallback(() => {
    if (!minDate) return false;
    const firstDayOfCurrentMonth = getStartOfDay(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    const minDateStart = getStartOfDay(minDate);
    return firstDayOfCurrentMonth <= minDateStart;
  }, [minDate, currentMonth]);

  const isNextMonthDisabled = useCallback(() => {
    if (!maxDate) return false;
    const firstDayOfNextMonth = getStartOfDay(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const maxDateStart = getStartOfDay(maxDate);
    return firstDayOfNextMonth > maxDateStart;
  }, [maxDate, currentMonth]);

  const prevMonth = () => {
    if (isPrevMonthDisabled()) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setViewMode('day'); // Ensure we are in day view after navigating month
  };

  const nextMonth = () => {
    if (isNextMonthDisabled()) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setViewMode('day'); // Ensure we are in day view after navigating month
  };

  // *** Navigation cho chế độ xem Tháng/Năm ***
  const isPrevYearDisabled = useCallback(() => {
      if (!minDate) return false;
      return viewingYear <= minDate.getFullYear();
  }, [minDate, viewingYear]);

  const isNextYearDisabled = useCallback(() => {
      if (!maxDate) return false;
      return viewingYear >= maxDate.getFullYear();
  }, [maxDate, viewingYear]);

  const prevYear = () => {
      if (isPrevYearDisabled()) return;
      setViewingYear(prev => prev - 1);
  }
  const nextYear = () => {
       if (isNextYearDisabled()) return;
      setViewingYear(prev => prev + 1);
  }

  // Kiểm tra xem một tháng có hợp lệ không (có ngày nào trong tháng nằm trong khoảng min/max)
  const isMonthValid = useCallback((year: number, monthIndex: number) => {
      const firstDayOfMonth = getStartOfDay(new Date(year, monthIndex, 1));
      const lastDayOfMonth = getStartOfDay(new Date(year, monthIndex + 1, 0));

      if (minDate && getStartOfDay(minDate) > lastDayOfMonth) {
          return false; // Toàn bộ tháng nằm trước minDate
      }
      if (maxDate && getStartOfDay(maxDate) < firstDayOfMonth) {
          return false; // Toàn bộ tháng nằm sau maxDate
      }
      return true;
  }, [minDate, maxDate]);


  // --- Handle Date Click ---
  const handleDateClick = (date: Date) => {
    const dateStartOfDay = getStartOfDay(date);
    if (!isDateInRange(dateStartOfDay)) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStartOfDay);
      setEndDate(undefined);
      setHoveredDate(null);
    }
    else if (startDate && !endDate) {
      if (dateStartOfDay < startDate) {
        setStartDate(dateStartOfDay);
      }
      else {
        setEndDate(dateStartOfDay);
        setHoveredDate(null);
        // Đảm bảo start <= end khi gọi onChange
        const finalStart = startDate < dateStartOfDay ? startDate : dateStartOfDay;
        const finalEnd = startDate < dateStartOfDay ? dateStartOfDay : startDate;
        onChange({ start: finalStart, end: finalEnd });
        setIsOpen(false);
      }
    }
  };

  // --- Visual Helpers ---
    const isStartDate = (date: Date) => startDate && getStartOfDay(date).getTime() === startDate.getTime();
    const isEndDate = (date: Date) => endDate && getStartOfDay(date).getTime() === endDate.getTime();
    const isInRange = (date: Date) => {
        if (!startDate || !endDate) return false;
        const dateStartOfDay = getStartOfDay(date);
        const rangeStart = startDate < endDate ? startDate : endDate;
        const rangeEnd = startDate < endDate ? endDate : startDate;
        return dateStartOfDay > rangeStart && dateStartOfDay < rangeEnd;
    };
    const isHoveredInRange = (date: Date) => {
        if (!startDate || endDate || !hoveredDate || !isDateInRange(date)) return false;
        const dateStartOfDay = getStartOfDay(date);
        const hoverStartOfDay = getStartOfDay(hoveredDate);
        const potentialStart = startDate < hoverStartOfDay ? startDate : hoverStartOfDay;
        const potentialEnd = startDate < hoverStartOfDay ? hoverStartOfDay : startDate;
        return dateStartOfDay > potentialStart && dateStartOfDay < potentialEnd;
    };
    const isToday = (date: Date) => {
        const todayStart = getStartOfDay(new Date());
        return getStartOfDay(date).getTime() === todayStart.getTime();
    };


  // Handle mouse enter/leave for hover effect
  const handleMouseEnter = (date: Date) => {
    if (!startDate || endDate || !isDateInRange(date)) return;
    setHoveredDate(getStartOfDay(date));
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  // --- Calculate dropdown position & Close on outside click ---
  useEffect(() => {
    if (!isOpen || !containerRef.current || !dropdownRef.current) return;
    const updatePosition = () => {
      if (!containerRef.current || !dropdownRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dropHeight = dropdownRef.current.offsetHeight || 350;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < dropHeight && rect.top > dropHeight) {
        setDropPosition('top');
      } else {
        setDropPosition('bottom');
      }
    };
    requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);


  // Display value for the button
  const displayValue = () => {
    if (startDate && endDate) {
      const displayStart = startDate <= endDate ? startDate : endDate;
      const displayEnd = startDate <= endDate ? endDate : startDate;
      return `${formatDate(displayStart)} - ${formatDate(displayEnd)}`;
    }
    // Optional: Show only start date while selecting?
    if (startDate && !endDate) return formatDate(startDate) + ' - ...';
    return <span className="text-muted-foreground text-base">{placeholder}</span>;
  };

  // --- Render Functions for Different Views ---

  // Render Chế độ xem Ngày (Calendar Grid)
  const renderDayView = () => (
    <>
      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-md font-medium text-muted-foreground h-8 flex items-center justify-center"> {day} </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-0">
        {getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()).map((dayObj, i) => {
          const dayStart = getStartOfDay(dayObj.date);
          const isCurrentMonthDay = dayObj.isCurrentMonth;
          // Ngày bị vô hiệu hóa nếu không thuộc tháng hiện tại HOẶC nằm ngoài khoảng min/max
          const isDisabled = !isCurrentMonthDay || !isDateInRange(dayStart);

          const isStart = isStartDate(dayStart);
          const isEnd = isEndDate(dayStart);
          const inRange = isInRange(dayStart);
          const inHoverRange = isHoveredInRange(dayStart);
          const isHovered = hoveredDate && dayStart.getTime() === hoveredDate.getTime();
          // const isEdgeHover = (isStart && isHovered && hoveredDate && endDate == null) || (isEnd && isHovered);

          // Tính toán class cho background (phần tử div bao ngoài)
          const getBackgroundClasses = () => {
              if (!isCurrentMonthDay) return ""; // Không tô màu nền cho ngày tháng khác
              if (isStart && isEnd) return "bg-primary rounded-full"; // Chọn 1 ngày duy nhất
              if (isStart) return "bg-primary rounded-l-full";
              if (isEnd) return "bg-primary rounded-r-full";
              if (inRange) return "bg-sky-500/25"; // Màu nền trong khoảng đã chọn
              // Màu nền khi đang hover để chọn ngày kết thúc
              if (inHoverRange) {
                   // Xác định đầu và cuối của khoảng hover
                   const hoverRangeStart = startDate && hoveredDate && startDate < hoveredDate ? startDate : hoveredDate;
                   const hoverRangeEnd = startDate && hoveredDate && startDate < hoveredDate ? hoveredDate : startDate;
                   if (dayStart.getTime() === hoverRangeStart?.getTime()) return "bg-sky-500/25 rounded-l-full";
                   if (dayStart.getTime() === hoverRangeEnd?.getTime()) return "bg-sky-500/25 rounded-r-full";
                   return "bg-sky-500/25";
              }
              return "";
          }

          return (
            <div
              key={i}
              className={cn(
                "relative p-0 h-8 flex items-center justify-center", // Container cho background, đảm bảo chiều cao
                getBackgroundClasses()
              )}
              onMouseEnter={() => isCurrentMonthDay && handleMouseEnter(dayObj.date)}
            >
              <Button
                variant="ghost"
                onClick={() => handleDateClick(dayObj.date)}
                disabled={isDisabled}
                className={cn(
                  "relative h-8 w-8 p-0 rounded-full flex items-center justify-center font-normal z-10", // Button trên nền
                  // Màu chữ cơ bản
                  isCurrentMonthDay ? 'text-foreground' : 'text-muted-foreground opacity-30', // Giảm opacity hơn cho ngày tháng khác
                  // Chỉ báo hôm nay
                  isToday(dayStart) && isCurrentMonthDay && !isStart && !isEnd && !inRange && !inHoverRange && "border border-primary",
                  // Hover cho ngày hợp lệ, chưa chọn, không trong khoảng
                  !isDisabled && !isStart && !isEnd && !inRange && !inHoverRange && !isHovered && "hover:bg-muted",
                  // Hover ngày đang được trỏ tới (preview)
                  isHovered && !isStart && !isEnd && !isDisabled && "bg-muted border border-foreground/50",
                  // Ngày bắt đầu/kết thúc được chọn
                  (isStart || isEnd) && isCurrentMonthDay ? 'bg-primary text-primary-foreground hover:bg-primary/90' : '',
                   // Chữ trong khoảng đã chọn (trừ start/end) cần rõ hơn trên nền range
                  inRange && !isStart && !isEnd && isCurrentMonthDay && "text-accent-foreground",
                   // Chữ trong khoảng đang hover (trừ start/end/hovered)
                   inHoverRange && !isStart && !isEnd && !isHovered && isCurrentMonthDay && "text-accent-foreground",
                  // Trạng thái vô hiệu hóa
                  isDisabled && 'cursor-not-allowed opacity-30',
                )}
                type="button"
                aria-label={`Chọn ngày ${formatDate(dayObj.date)}`}
              >
                <span className="text-md">{dayObj.date.getDate()}</span>
              </Button>
            </div>
          );
        })}
      </div>
       {/* Today button */}
       <div className="mt-3 pt-2 border-t text-center">
            {isDateInRange(new Date()) ? (
              <Button
                variant="link" className="text-md h-auto p-0 text-primary" type="button"
                onClick={() => {
                  const todayStart = getStartOfDay(new Date());
                  // Nếu chưa có start hoặc đã có cả start/end -> chọn today làm start mới
                  if(!startDate || (startDate && endDate)) {
                      setStartDate(todayStart);
                      setEndDate(undefined);
                      setHoveredDate(null);
                      setCurrentMonth(new Date(todayStart.getFullYear(), todayStart.getMonth(), 1));
                      setViewingYear(todayStart.getFullYear());
                      setViewMode('day');
                  }
                  // Nếu đã có start, chưa có end -> chọn today làm end (nếu hợp lệ)
                  else if (startDate && !endDate && todayStart >= startDate) {
                      setEndDate(todayStart);
                      setHoveredDate(null);
                      onChange({ start: startDate, end: todayStart });
                      setIsOpen(false); // Đóng picker sau khi chọn xong khoảng
                  }
                  // Nếu đã có start, chưa có end, nhưng today < start -> today thành start mới
                  else if (startDate && !endDate && todayStart < startDate) {
                      setStartDate(todayStart);
                      setEndDate(undefined); // Giữ nguyên chưa chọn end
                      setHoveredDate(null);
                      setCurrentMonth(new Date(todayStart.getFullYear(), todayStart.getMonth(), 1));
                      setViewingYear(todayStart.getFullYear());
                      setViewMode('day');
                  }
                }}
              >
                { startDate && !endDate ? "Chọn hôm nay làm Ngày kết thúc" : "Chọn hôm nay làm Ngày bắt đầu" }
              </Button>
            ) : (
                 <span className="text-md text-muted-foreground">Hôm nay không khả dụng</span>
            )}
          </div>
    </>
  );

  // Render Chế độ xem Chọn Tháng
  const renderMonthView = () => (
    <div className="grid grid-cols-3 gap-2 p-2">
      {MONTHS.map((month, index) => {
        const isDisabled = !isMonthValid(viewingYear, index);
        const isCurrentDisplayMonth = currentMonth.getFullYear() === viewingYear && currentMonth.getMonth() === index;

        return (
          <Button
            key={month}
            variant={isCurrentDisplayMonth ? "default" : "ghost"}
            className={cn("w-full justify-center text-md", isDisabled && "opacity-50 cursor-not-allowed")}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              setCurrentMonth(new Date(viewingYear, index, 1));
              setViewMode('day'); // Quay lại xem ngày sau khi chọn tháng
            }}
            type="button"
            aria-label={`Chọn ${month} ${viewingYear}`}
          >
            {month}
          </Button>
        );
      })}
    </div>
  );

  // --- Render Chính ---
  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Button mở/đóng */}
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)} // Add disabled check
        disabled={disabled} // Add disabled prop
        className="w-full justify-start text-left font-normal h-10 px-3 py-2" // Kích thước chuẩn của input shadcn
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayValue()}
      </Button>

      {/* Calendar dropdown - don't show if disabled */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className={cn(`absolute z-50 ${dropPosition === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'
            } w-[320px] bg-background rounded-md shadow-lg border p-3`)}
          onMouseLeave={handleMouseLeave}
        >
          {/* --- Header Động --- */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost" size="icon" type="button"
              // Nút prev: chuyển năm nếu ở view tháng, chuyển tháng nếu ở view ngày
              className={cn("h-8 w-8 p-0",
                (viewMode === 'day' && isPrevMonthDisabled()) || (viewMode === 'month' && isPrevYearDisabled())
                 ? 'opacity-30 cursor-not-allowed' : ''
              )}
              onClick={viewMode === 'day' ? prevMonth : prevYear}
              disabled={(viewMode === 'day' && isPrevMonthDisabled()) || (viewMode === 'month' && isPrevYearDisabled())}
              aria-label={viewMode === 'day' ? "Tháng trước" : "Năm trước"}
            > <ChevronLeft className="h-5 w-5" /> </Button>

            {/* Nút bấm để chuyển đổi giữa xem ngày và xem tháng */}
            <Button
              variant="ghost" type="button"
              className="font-medium grow text-center px-2"
              onClick={() => {
                  if (viewMode === 'day') {
                      setViewingYear(currentMonth.getFullYear()); // Đảm bảo năm xem khớp
                      setViewMode('month');
                  } else {
                      setViewMode('day');
                  }
              }}
            >
                <span className="text-base">{viewMode === 'day' ? `${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}` : viewingYear}</span>
            </Button>

            <Button
              variant="ghost" size="icon" type="button"
              // Nút next: chuyển năm nếu ở view tháng, chuyển tháng nếu ở view ngày
               className={cn("h-8 w-8 p-0",
                (viewMode === 'day' && isNextMonthDisabled()) || (viewMode === 'month' && isNextYearDisabled())
                 ? 'opacity-30 cursor-not-allowed' : ''
              )}
              onClick={viewMode === 'day' ? nextMonth : nextYear}
              disabled={(viewMode === 'day' && isNextMonthDisabled()) || (viewMode === 'month' && isNextYearDisabled())}
              aria-label={viewMode === 'day' ? "Tháng sau" : "Năm sau"}
            > <ChevronRight className="h-5 w-5" /> </Button>
          </div>

          {/* --- Nội dung động dựa trên viewMode --- */}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'month' && renderMonthView()}
        </div>
      )}
    </div>
  );
};