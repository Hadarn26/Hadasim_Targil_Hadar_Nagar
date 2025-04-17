import pandas as pd
import os
import glob
from collections import Counter, defaultdict
from datetime import datetime

# ================================
# Logs - Part A
# ================================

def read_logs_from_excel(file_path):
    """
    Reads logs from an Excel file and returns a list of log lines.
    """
    df = pd.read_excel(file_path)
    return df.iloc[:, 0].dropna().astype(str).tolist()

def split_excel_logs_to_text_parts(file_path, lines_per_chunk=10000, output_dir="log_chunks"):
    """
    Splits the large Excel log file into smaller .txt files with a defined number of lines.
    """
    logs = read_logs_from_excel(file_path)
    os.makedirs(output_dir, exist_ok=True)
    for index in range(0, len(logs), lines_per_chunk):
        chunk = logs[index:index + lines_per_chunk]
        filename = os.path.join(output_dir, f"log_chunk_{index // lines_per_chunk + 1}.txt")
        with open(filename, "w", encoding="utf-8") as file:
            file.write("\n".join(chunk))

def count_log_errors(filepath):
    """
    Counts occurrences of each error line in a given text file.
    """
    with open(filepath, encoding="utf-8") as f:
        return Counter(line.strip() for line in f if line.strip())

def merge_counters(counters):
    """
    Merges multiple Counter objects into one.
    """
    total = Counter()
    for c in counters:
        total.update(c)
    return total

def top_n_errors(merged_counter, n):
    """
    Returns the N most common errors from the merged Counter.
    """
    return merged_counter.most_common(n)

 # סיבוכיות זמן:
    # -----------------------------
    # נניח שהקובץ logs.txt כולל N שורות.
    # פיצול הקובץ לחלקים – O(N)
    # ספירת קודים בכל חלק – O(M) עבור כל חלק (סה"כ עדיין O(N))
    # מיזוג התוצאות – O(K) כאשר K הוא מספר הקודים הייחודיים
    # מציאת N הקודים השכיחים ביותר – O(K log N) באמצעות heap
    # סה"כ סיבוכיות זמן: O(N + K log N)

    # סיבוכיות מקום:
    # -----------------------------
    # החזקת רשימה של O(N) שורות – ניתן לייעל על ידי קריאה שורה-שורה מקובץ טקסט.
    # המילון של הספירות שומר O(K) קודים שונים בזיכרון.


# ================================
# Time Series - Part B
# ================================

def read_time_series(file_path):
    """
    Reads time series data from CSV, Excel, or Parquet format.
    """
    ext = os.path.splitext(file_path)[-1].lower()
    if ext == ".csv":
        return pd.read_csv(file_path, parse_dates=["timestamp"])
    elif ext in [".xlsx", ".xls"]:
        return pd.read_excel(file_path, parse_dates=["timestamp"])
    elif ext == ".parquet":
        return pd.read_parquet(file_path)
    else:
        raise ValueError("Unsupported file format")

def validate_time_series(df):
    """
    Validates and cleans a time series DataFrame.
    Removes duplicates, fixes column names, checks required columns, and ensures numeric values.
    """
    df = df.drop_duplicates()
    df.columns = [col.strip().lower() for col in df.columns]

    if "value" not in df.columns and "mean_value" in df.columns:
        df["value"] = df["mean_value"]

    if "timestamp" not in df.columns or "value" not in df.columns:
        raise ValueError("Missing required columns: 'timestamp' and 'value' or 'mean_value'")

    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")

    df["value"] = pd.to_numeric(df["value"], errors="coerce")

    # Additional check: remove negative values (if not allowed in context)
    df = df[df["value"] >= 0]

    df = df.dropna(subset=["timestamp", "value"])
    return df

def compute_hourly_averages(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes average value for each full hour.
    """
    df["Hour"] = df["timestamp"].dt.floor("h")
    return (
        df.groupby("Hour")["value"]
        .mean()
        .reset_index()
        .rename(columns={"Hour": "Start Time", "value": "Average Value"})
    )

def compute_average_by_hour_only(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes average value by hour of day (0-23), regardless of date.
    """
    df["Hour Only"] = df["timestamp"].dt.hour
    hourly_avg = (
        df.groupby("Hour Only")["value"]
        .mean()
        .reset_index()
        .rename(columns={"Hour Only": "Hour", "value": "Average Value"})
    )
    return hourly_avg.sort_values("Hour")

def split_time_series_by_day(df, output_dir="daily_parts"):
    """
    Splits time series into daily CSV files.
    """
    os.makedirs(output_dir, exist_ok=True)
    df["Date"] = df["timestamp"].dt.date
    for date, group in df.groupby("Date"):
        group.drop(columns=["Date"], inplace=True)
        file_path = os.path.join(output_dir, f"time_series_{date}.csv")
        group.to_csv(file_path, index=False)

def compute_hourly_averages_from_parts(input_dir="daily_parts"):
    """
    Computes hourly averages from multiple daily CSV files.
    """
    all_parts = glob.glob(os.path.join(input_dir, "*.csv"))
    all_dfs = []
    for part in all_parts:
        try:
            df = pd.read_csv(part, parse_dates=["timestamp"])
            df = validate_time_series(df)
            hourly = compute_hourly_averages(df)
            all_dfs.append(hourly)
        except Exception as e:
            print(f" Error processing {part}: {e}")
    if not all_dfs:
        print(" No valid time series data found.")
        return pd.DataFrame()
    final_df = pd.concat(all_dfs)
    final_df = final_df.groupby("Start Time")["Average Value"].mean().reset_index()
    final_df.to_csv("final_hourly_averages.csv", index=False)
    return final_df

# ================================
# Streaming Support - Part B.4
# ================================

class HourlyAverager:
    """
    Class to handle streaming updates and compute running hourly averages.
    """
    def __init__(self):
        self.hourly_data = defaultdict(lambda: {"sum": 0.0, "count": 0})

    def update(self, timestamp, value):
        hour = pd.to_datetime(timestamp).floor("h")
        self.hourly_data[hour]["sum"] += value
        self.hourly_data[hour]["count"] += 1

    def get_hourly_averages(self):
        return {
            hour: round(data["sum"] / data["count"], 2)
            for hour, data in self.hourly_data.items() if data["count"] > 0
        }

  # ================================
    # יתרונות Parquet לעומת CSV
    # ================================
    # 1. דחיסה חזקה יותר – קובץ קטן משמעותית.
    # 2. פורמט עמודות – קריאה של שדות בודדים ביעילות.
    # 3. כולל מטא-דאטה כמו סוגי שדות.
    # 4. מהיר בהרבה לפריסה בפרויקטים עם דאטה גדול.
    # 5. נתמך במערכות Big Data (כמו Spark / Athena).

# ================================
# Main - Example Execution
# ================================

if __name__ == "__main__":
    # --- Part A: Logs ---
    log_file_path = "logs.txt.xlsx"
    split_excel_logs_to_text_parts(log_file_path)
    counters = [count_log_errors(f) for f in glob.glob("log_chunks/*.txt")]
    merged = merge_counters(counters)
    top_errors = top_n_errors(merged, 5)

    print("\nMost common errors:")
    for err, count in top_errors:
        print(f"{err}: {count}")

    pd.DataFrame(top_errors, columns=["Error", "Count"]).to_csv("top_n_errors.csv", index=False)

    # --- Part B: Time Series ---
    time_series_path = "time_series.parquet"  # or time_series.xlsx or .csv
    df = read_time_series(time_series_path)
    df = validate_time_series(df)

    split_time_series_by_day(df)
    final_df = compute_hourly_averages_from_parts()

    avg_by_hour = compute_average_by_hour_only(df)
    avg_by_hour.to_csv("average_by_hour_only.csv", index=False)

    print("\nAverage value by hour (ignoring date):")
    print(avg_by_hour)

    print("\nHourly averages from daily files:")
    print(final_df)

    print("\nProcessing stream simulation:")
    stream_avg = HourlyAverager()
    for _, row in df.iterrows():
        stream_avg.update(row["timestamp"], row["value"])

    hourly_avg_live = stream_avg.get_hourly_averages()
    for hour, avg in sorted(hourly_avg_live.items()):
        print(f"{hour}: {avg}")
