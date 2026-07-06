import sqlite3
import pandas as pd
import json

def main():
    conn = sqlite3.connect('mlflow.db')
    
    query = """
    SELECT r.run_uuid, m.key, m.value, m.step
    FROM runs r
    JOIN metrics m ON r.run_uuid = m.run_uuid
    ORDER BY r.start_time DESC, m.step ASC
    """
    
    df = pd.read_sql_query(query, conn)
    
    if df.empty:
        print("No metrics found in mlflow.db.")
        conn.close()
        return
        
    latest_run_id = df['run_uuid'].iloc[0]
    df_latest = df[df['run_uuid'] == latest_run_id]
    
    df_pivot = df_latest.pivot(index='step', columns='key', values='value')
    df_pivot.to_csv('history.csv')
    print("history.csv created successfully.")
    
    # Also create a JSON version for the frontend to easily fetch
    # Ensure there is an 'epoch' column or we use step + 1
    records = []
    for step, row in df_pivot.iterrows():
        records.append({
            "epoch": int(step) + 1,
            "acc": float(row.get('val_acc', 0)),
            "loss": float(row.get('train_loss', 0)),
            "f1": float(row.get('val_macro_f1', 0))
        })
        
    with open('history.json', 'w') as f:
        json.dump(records, f, indent=2)
    print("history.json created successfully.")
    conn.close()

if __name__ == "__main__":
    main()
