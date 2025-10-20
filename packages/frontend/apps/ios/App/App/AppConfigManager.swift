import Foundation

final class AppConfigManager {
  struct AppConfig: Decodable {
    let yunkeVersion: String
  }
  
  static var yunkeVersion: String? = nil
  
  static func getYunkeVersion() -> String {
    if yunkeVersion == nil {
      let file = Bundle(for: AppConfigManager.self).url(forResource: "capacitor.config", withExtension: "json")!
      let data = try! Data(contentsOf: file)
      let config = try! JSONDecoder().decode(AppConfig.self, from: data)
      yunkeVersion = config.yunkeVersion
    }
    
    return yunkeVersion!
  }
}
